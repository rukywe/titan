import { prisma } from '../lib/prisma';
import { Investor, InvestorType } from '@prisma/client';
import { logger } from '../lib/logger';

interface CreateInvestorInput {
  name: string;
  investor_type: string;
  email: string;
}

export const investorService = {
  async list(): Promise<Investor[]> {
    return prisma.investor.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async create(data: CreateInvestorInput): Promise<Investor> {
    logger.info(
      { name: data.name, email: data.email, investorType: data.investor_type },
      'Creating investor'
    );

    let investorType: InvestorType;
    if (data.investor_type === 'Individual') {
      investorType = 'Individual';
    } else if (data.investor_type === 'Institution') {
      investorType = 'Institution';
    } else if (data.investor_type === 'Family Office') {
      investorType = 'FamilyOffice';
    } else {
      logger.error(
        { investorType: data.investor_type },
        'Invalid investor type'
      );
      throw new Error(`Invalid investor type: ${data.investor_type}`);
    }

    const investor = await prisma.investor.create({
      data: {
        name: data.name,
        investorType: investorType,
        email: data.email
      }
    });

    logger.info(
      { investorId: investor.id, email: investor.email },
      'Investor created successfully'
    );

    return investor;
  }
};
