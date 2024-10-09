import { TransactionType } from '../types/transaction';
import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionRequest {
  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  value: number;

  @IsUUID()
  categoryId: string;

  @IsString()
  type: TransactionType;
}

export class GetTransactionsSummaryRequest {
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
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
  @IsDate()
  startDate?: Date;

  @IsOptional()
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
