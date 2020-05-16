import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const income = transactions.reduce(
      (accumulator: number, current: Transaction) => {
        if (current.type === 'income') {
          return accumulator + current.value;
        }
        return accumulator;
      },
      0,
    );

    const outcome = transactions.reduce(
      (accumulator: number, current: Transaction) => {
        if (current.type === 'outcome') {
          return accumulator + current.value;
        }
        return accumulator;
      },
      0,
    );

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;
