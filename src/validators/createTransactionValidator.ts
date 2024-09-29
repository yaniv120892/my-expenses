import categoryRepository from '@src/repositories/categoryRepository';
import { CreateTransaction } from '@src/types/transaction';
import { CustomValidationError } from '@src/errors/validationError';

class CreateTransactionValidator {
  public async validate(data: CreateTransaction): Promise<void> {
    const category = await categoryRepository.getCategoryById(data.categoryId);

    if (!category) {
      throw new CustomValidationError(
        `Category with id ${data.categoryId} not found`,
      );
    }
  }
}

export default new CreateTransactionValidator();
