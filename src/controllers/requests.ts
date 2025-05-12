import { TransactionType } from '../types/transaction';
import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
