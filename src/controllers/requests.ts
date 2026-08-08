import { TransactionStatus, TransactionType } from '../types/transaction';
import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
  IsEnum,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  IsEmail,
  IsNotEmpty,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
//TODO: remove this import and create an enum for schedule types that is not depending on Prisma
import { ScheduleType } from '@prisma/client';

function IsValidScheduledCombination(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidScheduledCombination',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const { scheduleType, dayOfWeek, dayOfMonth } = args.object as {
            scheduleType?: ScheduleType;
            dayOfWeek?: number | null;
            dayOfMonth?: number | null;
          };
          if (scheduleType === 'WEEKLY') {
            if (dayOfWeek === undefined || dayOfWeek === null) return false;
            if (dayOfMonth !== undefined) return false;
          }
          if (scheduleType === 'MONTHLY') {
            if (dayOfMonth === undefined || dayOfMonth === null) return false;
            if (dayOfWeek !== undefined) return false;
          }
          if (scheduleType !== 'WEEKLY' && dayOfWeek !== undefined)
            return false;
          if (scheduleType !== 'MONTHLY' && dayOfMonth !== undefined)
            return false;
          return true;
        },
      },
    });
  };
}

export class CreateTransactionRequest {
  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  value: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsString()
  type: TransactionType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;
}

export class UpdateTransactionRequest {
  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  value: number;

  @IsUUID()
  categoryId: string;

  @IsString()
  type: TransactionType;

  @Type(() => Date)
  @IsDate()
  date: Date;
}

export class UpdateTransactionStatusRequest {
  @IsString()
  status: TransactionStatus;
}

export class GetTransactionsSummaryRequest {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  type?: TransactionType;
}

export class GetTransactionsRequest {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  type?: TransactionType;

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  smartSearch?: boolean;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number;

  @IsNumber()
  @Min(10)
  @Type(() => Number)
  perPage: number;
}

export class WebhookChat {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class WebhookMessage {
  @IsString()
  text: string;

  // Every other nested/coerced field here names its type explicitly. These two
  // were the only ones leaning on emitDecoratorMetadata to infer it, which is a
  // tsc feature — Vercel now compiles these sources itself, so the inference is
  // no longer guaranteed. Without a type, class-transformer leaves the nested
  // value a plain object and @ValidateNested() silently passes anything.
  @ValidateNested()
  @Type(() => WebhookChat)
  chat: WebhookChat;
}

export class WebhookRequest {
  @ValidateNested()
  @Type(() => WebhookMessage)
  message: WebhookMessage;
}

export class CreateScheduledTransactionRequest {
  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  value: number;

  @IsString()
  type: TransactionType;

  @IsUUID()
  categoryId: string;

  @IsEnum(ScheduleType)
  scheduleType: ScheduleType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  interval?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dayOfWeek?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dayOfMonth?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  monthOfYear?: number;

  @IsValidScheduledCombination({
    message: 'Invalid combination of scheduleType, dayOfWeek, and dayOfMonth',
  })
  // Marker property: exists only to carry the class-validator decorator above.
  dummy?: unknown;
}

export class UpdateScheduledTransactionRequest {
  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  value: number;

  @IsUUID()
  categoryId: string;

  @IsString()
  type: TransactionType;

  @IsEnum(ScheduleType)
  scheduleType: ScheduleType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  interval?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dayOfWeek?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  dayOfMonth?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  monthOfYear?: number;

  @IsValidScheduledCombination({
    message: 'Invalid combination of scheduleType, dayOfWeek, and dayOfMonth',
  })
  // Marker property: exists only to carry the class-validator decorator above.
  dummy?: unknown;
}

export class LoginRequest {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class VerifyLoginCodeRequest {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class SignupRequest {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class UserSettingsInfoDto {
  @IsEmail()
  email: string;
}

export class UserSettingsNotificationsDto {
  @IsBoolean()
  createTransaction: boolean;

  @IsBoolean()
  dailySummary: boolean;

  @IsBoolean()
  subscriptionAudit: boolean;
}

export class NotificationProviderDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  telegramChatId: string | null;
}

export class UserSettingsResponse {
  @ValidateNested()
  @Type(() => UserSettingsInfoDto)
  info: UserSettingsInfoDto;

  @ValidateNested()
  @Type(() => UserSettingsNotificationsDto)
  notifications: UserSettingsNotificationsDto;

  @ValidateNested()
  @Type(() => NotificationProviderDto)
  provider: NotificationProviderDto;
}

export class UpdateUserSettingsRequest {
  @ValidateNested()
  @Type(() => UserSettingsInfoDto)
  info: UserSettingsInfoDto;

  @ValidateNested()
  @Type(() => UserSettingsNotificationsDto)
  notifications: UserSettingsNotificationsDto;

  @ValidateNested()
  @Type(() => NotificationProviderDto)
  provider: NotificationProviderDto;
}

export class TestTelegramRequest {
  @IsString()
  @IsNotEmpty()
  chatId: string;
}

export class ConvertSubscriptionRequest {
  @IsUUID()
  categoryId: string;
}
