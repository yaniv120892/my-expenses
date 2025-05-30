import { TransactionType } from '@prisma/client';

export type TrendPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type TrendPoint = {
  date: string;
  amount: number;
  count: number;
};

export type CategoryTrendPoint = TrendPoint & {
  categoryId: string;
  categoryName: string;
};

export type SpendingTrend = {
  period: TrendPeriod;
  startDate: string;
  endDate: string;
  points: TrendPoint[];
  totalAmount: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
};

export type CategorySpendingTrend = {
  period: TrendPeriod;
  startDate: string;
  endDate: string;
  points: CategoryTrendPoint[];
  totalAmount: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  categoryId: string;
  categoryName: string;
};

export interface GetSpendingTrendsRequest {
  startDate?: Date;
  endDate?: Date;
  period: TrendPeriod;
  categoryId?: string;
  transactionType?: TransactionType;
}
