import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

import CreateCategoryService from './CreateCategoryService';

interface Request {
  title: string;
  value: number;
  type: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError('No balance available', 400);
    }

    const checkCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!checkCategory) {
      const createCategoryService = new CreateCategoryService();
      const createdCategory = await createCategoryService.execute({
        title: category,
      });

      const transaction = transactionRepository.create({
        title,
        value,
        type,
        category_id: createdCategory.id,
      });

      await transactionRepository.save(transaction);

      return transaction;
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: checkCategory.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
