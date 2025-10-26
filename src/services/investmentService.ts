import { prisma } from '../lib/prisma';
import { Investment } from '@prisma/client';
import { NotFoundError, BusinessRuleError } from '../lib/errors';
import { logger } from '../lib/logger';

interface CreateInvestmentInput {
  investor_id: string;
  amount_usd: number;
  investment_date: string;
}

export const investmentService = {
  async listByFund(fundId: string): Promise<Investment[]> {
    return prisma.investment.findMany({
      where: { fundId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async create(
    fundId: string,
    data: CreateInvestmentInput
  ): Promise<Investment> {
    logger.info(
      { fundId, investorId: data.investor_id, amountUsd: data.amount_usd },
      'Creating investment'
    );

    return prisma.$transaction(async (tx) => {
      const fund = await tx.fund.findUnique({
        where: { id: fundId }
      });

      if (!fund) {
        logger.warn({ fundId }, 'Fund not found');
        throw new NotFoundError('Fund not found');
      }

      if (fund.status === 'Closed') {
        logger.warn(
          { fundId, status: fund.status },
          'Attempted to invest in closed fund'
        );
        throw new BusinessRuleError('Cannot invest in a closed fund');
      }

      const investor = await tx.investor.findUnique({
        where: { id: data.investor_id }
      });

      if (!investor) {
        logger.warn({ investorId: data.investor_id }, 'Investor not found');
        throw new NotFoundError('Investor not found');
      }

      const investment = await tx.investment.create({
        data: {
          investorId: data.investor_id,
          fundId: fundId,
          amountUsd: data.amount_usd.toString(),
          investmentDate: new Date(data.investment_date)
        }
      });

      logger.info(
        { investmentId: investment.id, fundId, investorId: data.investor_id },
        'Investment created successfully'
      );

      return investment;
    });
  }
};
