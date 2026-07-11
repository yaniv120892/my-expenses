import {
  AgentPendingAction,
  AgentToolExecutionRequest,
  AgentToolName,
  AgentToolResult,
  CreateTransactionPendingActionPayload,
} from '../../types/agent';
import { TransactionType } from '../../types/transaction';

interface TransactionServicePort {
  getTransactions(filters: {
    userId: string;
    page: number;
    perPage: number;
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    transactionType?: TransactionType;
    searchTerm?: string;
    smartSearch?: boolean;
  }): Promise<unknown[]>;
  getTransactionsSummary(filters: {
    userId: string;
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    transactionType?: TransactionType;
  }): Promise<{ totalIncome: number; totalExpense: number }>;
  createTransaction(data: {
    description: string;
    value: number;
    date: Date;
    categoryId: string;
    type: TransactionType;
    userId: string;
  }): Promise<{ id: string }>;
}

interface CategoryRepositoryPort {
  getAllCategories(): Promise<{ id: string; name: string }[]>;
}

interface AgentRepositoryPort {
  createPendingAction(
    conversationId: string,
    userId: string,
    type: 'CREATE_TRANSACTION',
    payload: CreateTransactionPendingActionPayload,
  ): Promise<AgentPendingAction>;
  getPendingAction(
    pendingActionId: string,
    userId: string,
  ): Promise<AgentPendingAction | null>;
  markPendingActionConfirmed(
    pendingActionId: string,
    transactionId: string,
  ): Promise<void>;
}

export interface AgentToolRegistryDependencies {
  transactionService: TransactionServicePort;
  categoryRepository: CategoryRepositoryPort;
  agentRepository: AgentRepositoryPort;
}

export class AgentToolRegistry {
  private readonly transactionService: TransactionServicePort;
  private readonly categoryRepository: CategoryRepositoryPort;
  private readonly agentRepository: AgentRepositoryPort;

  public constructor(dependencies?: Partial<AgentToolRegistryDependencies>) {
    const defaultDependencies = dependencies
      ? undefined
      : this.createDefaultDependencies();
    this.transactionService =
      dependencies?.transactionService ||
      (defaultDependencies as AgentToolRegistryDependencies).transactionService;
    this.categoryRepository =
      dependencies?.categoryRepository ||
      (defaultDependencies as AgentToolRegistryDependencies).categoryRepository;
    this.agentRepository =
      dependencies?.agentRepository ||
      (defaultDependencies as AgentToolRegistryDependencies).agentRepository;
  }

  public getToolNames(): AgentToolName[] {
    return [
      'search_transactions',
      'get_transaction_summary',
      'list_categories',
      'create_transaction_draft',
    ];
  }

  public async executeTool(
    request: AgentToolExecutionRequest,
  ): Promise<AgentToolResult> {
    switch (request.name) {
      case 'search_transactions':
        return this.searchTransactions(request);
      case 'get_transaction_summary':
        return this.getTransactionSummary(request);
      case 'list_categories':
        return this.listCategories();
      case 'create_transaction_draft':
        return this.createTransactionDraft(request);
    }
  }

  public async confirmPendingAction(
    pendingActionId: string,
    userId: string,
  ): Promise<{ transactionId: string }> {
    const pendingAction = await this.agentRepository.getPendingAction(
      pendingActionId,
      userId,
    );

    if (!pendingAction) {
      throw new Error('Pending action not found.');
    }

    if (pendingAction.status !== 'PENDING') {
      throw new Error('Pending action was already resolved.');
    }

    if (pendingAction.type !== 'CREATE_TRANSACTION') {
      throw new Error('Unsupported pending action type.');
    }

    const payload = pendingAction.payload;
    const result = await this.transactionService.createTransaction({
      description: payload.description,
      value: payload.value,
      date: new Date(payload.date),
      categoryId: payload.categoryId,
      type: payload.type,
      userId,
    });

    await this.agentRepository.markPendingActionConfirmed(
      pendingActionId,
      result.id,
    );

    return { transactionId: result.id };
  }

  private async searchTransactions(
    request: AgentToolExecutionRequest,
  ): Promise<AgentToolResult> {
    const args = request.arguments;
    const transactions = await this.transactionService.getTransactions({
      userId: request.userId,
      page: this.getPositiveInteger(args.page, 1),
      perPage: Math.min(this.getPositiveInteger(args.perPage, 10), 25),
      startDate: this.getOptionalDate(args.startDate),
      endDate: this.getOptionalDate(args.endDate),
      categoryId: this.getOptionalString(args.categoryId),
      transactionType: this.getOptionalTransactionType(args.transactionType),
      searchTerm: this.getOptionalString(args.searchTerm),
      smartSearch: true,
    });

    return {
      summary: `Found ${transactions.length} matching transactions.`,
      data: { transactions },
    };
  }

  private async getTransactionSummary(
    request: AgentToolExecutionRequest,
  ): Promise<AgentToolResult> {
    const args = request.arguments;
    const summary = await this.transactionService.getTransactionsSummary({
      userId: request.userId,
      startDate: this.getOptionalDate(args.startDate),
      endDate: this.getOptionalDate(args.endDate),
      categoryId: this.getOptionalString(args.categoryId),
      transactionType: this.getOptionalTransactionType(args.transactionType),
    });

    return {
      summary: `Income: ${summary.totalIncome}, expenses: ${summary.totalExpense}.`,
      data: { summary },
    };
  }

  private async listCategories(): Promise<AgentToolResult> {
    const categories = await this.categoryRepository.getAllCategories();

    return {
      summary: `Found ${categories.length} categories.`,
      data: { categories },
    };
  }

  private async createTransactionDraft(
    request: AgentToolExecutionRequest,
  ): Promise<AgentToolResult> {
    const payload = await this.getCreateTransactionPayload(request.arguments);
    const pendingAction = await this.agentRepository.createPendingAction(
      request.conversationId,
      request.userId,
      'CREATE_TRANSACTION',
      payload,
    );

    return {
      summary:
        'Created a pending transaction action. User confirmation is required before writing.',
      data: { pendingActionId: pendingAction.id },
      pendingAction,
    };
  }

  private async getCreateTransactionPayload(
    args: Record<string, unknown>,
  ): Promise<CreateTransactionPendingActionPayload> {
    const description = this.getRequiredString(args.description, 'description');
    const value = this.getRequiredNumber(args.value, 'value');
    const date = this.getRequiredDateString(args.date, 'date');
    const type = this.getRequiredTransactionType(args.type);
    const categoryId =
      this.getOptionalString(args.categoryId) ||
      (await this.resolveCategoryId(this.getOptionalString(args.categoryName)));

    if (!categoryId) {
      throw new Error('A valid category is required to create a transaction.');
    }

    return {
      description,
      value,
      date,
      type,
      categoryId,
    };
  }

  private async resolveCategoryId(
    categoryName: string | undefined,
  ): Promise<string | undefined> {
    if (!categoryName) {
      return undefined;
    }

    const lowerCategoryName = categoryName.toLowerCase();
    const categories = await this.categoryRepository.getAllCategories();
    const category = categories.find(
      (currentCategory) =>
        currentCategory.name.toLowerCase() === lowerCategoryName,
    );

    return category?.id;
  }

  private getRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${fieldName} is required.`);
    }

    return value.trim();
  }

  private getOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return undefined;
    }

    return value.trim();
  }

  private getRequiredNumber(value: unknown, fieldName: string): number {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
      throw new Error(`${fieldName} must be a positive number.`);
    }

    return value;
  }

  private getPositiveInteger(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      return fallback;
    }

    return value;
  }

  private getRequiredDateString(value: unknown, fieldName: string): string {
    const date = this.getOptionalDate(value);
    if (!date) {
      throw new Error(`${fieldName} must be a valid date.`);
    }

    return date.toISOString().slice(0, 10);
  }

  private getOptionalDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  }

  private getRequiredTransactionType(value: unknown): TransactionType {
    const type = this.getOptionalTransactionType(value);
    if (!type) {
      throw new Error('type must be INCOME or EXPENSE.');
    }

    return type;
  }

  private getOptionalTransactionType(
    value: unknown,
  ): TransactionType | undefined {
    if (value === 'INCOME' || value === 'EXPENSE') {
      return value;
    }

    return undefined;
  }

  private createDefaultDependencies(): AgentToolRegistryDependencies {
    const transactionServiceModule = require('../transactionService') as {
      default: TransactionServicePort;
    };
    const categoryRepositoryModule =
      require('../../repositories/categoryRepository') as {
        default: CategoryRepositoryPort;
      };
    const agentRepositoryModule =
      require('../../repositories/agentRepository') as {
        default: AgentRepositoryPort;
      };

    return {
      transactionService: transactionServiceModule.default,
      categoryRepository: categoryRepositoryModule.default,
      agentRepository: agentRepositoryModule.default,
    };
  }
}

export default AgentToolRegistry;
