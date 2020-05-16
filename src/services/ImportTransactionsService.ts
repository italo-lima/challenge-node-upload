import fs from 'fs';
import csv from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  transactionsCsv: string;
}

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ transactionsCsv }: Request): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const parsers = csv({
      from_line: 2,
    });

    const categories: string[] = [];
    const transactions: TransactionCSV[] = [];

    const transactionReadStrem = fs.createReadStream(transactionsCsv);
    const parseCSV = transactionReadStrem.pipe(parsers);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((transaction: string) =>
        transaction.trim(),
      );

      categories.push(category);
      transactions.push({ title, type, value: parseInt(value, 10), category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoryRepository.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    const createNewCategories = categories
      .filter((title: string) => !existentCategoriesTitle.includes(title))
      .filter((value, index, array) => array.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      createNewCategories.map(title => ({ title })),
    );

    await categoryRepository.save(newCategories);

    const savedCategories = [...newCategories, ...existentCategories];

    const newTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: savedCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(newTransactions);

    await fs.promises.unlink(transactionsCsv);

    return newTransactions;
  }
}

export default ImportTransactionsService;
