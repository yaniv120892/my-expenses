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
} from 'class-validator';
import { Type } from 'class-transformer';
//TODO: remove this import and create an enum for schedule types that is not depending on Prisma
import { ScheduleType } from '@prisma/client';

function IsValidScheduledCombination(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidScheduledCombination',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const { scheduleType, dayOfWeek, dayOfMonth } = args.object as any;
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

  @ValidateNested()
  chat: WebhookChat;
}

export class WebhookRequest {
  @ValidateNested()
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
  dummy?: any;
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
  dummy?: any;
}

export class LoginRequest {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
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
}

export class UserSettingsResponse {
  @ValidateNested()
  @Type(() => UserSettingsInfoDto)
  info: UserSettingsInfoDto;

  @ValidateNested()
  @Type(() => UserSettingsNotificationsDto)
  notifications: UserSettingsNotificationsDto;
}

export class UpdateUserSettingsRequest {
  @ValidateNested()
  @Type(() => UserSettingsInfoDto)
  info: UserSettingsInfoDto;

  @ValidateNested()
  @Type(() => UserSettingsNotificationsDto)
  notifications: UserSettingsNotificationsDto;
}
