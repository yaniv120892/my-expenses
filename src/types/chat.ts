export type AggregationType =
  | 'total'
  | 'average'
  | 'count'
  | 'breakdown_by_category'
  | 'breakdown_by_month'
  | 'min_max'
  | 'list';

export interface ChatIntent {
  intent:
    | 'list_transactions'
    | 'get_transaction_summary'
    | 'compare_periods'
    | 'general_question';
  parameters: {
    category?: string;
    startDate?: string;
    endDate?: string;
    transactionType?: 'INCOME' | 'EXPENSE';
  };
  aggregation?: AggregationType;
}

export interface AggregationResult {
  summary: string;
  data: Record<string, number | string>;
  transactionCount: number;
}
