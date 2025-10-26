import { prisma } from '../lib/prisma';
import { Fund, FundStatus } from '@prisma/client';
import { logger } from '../lib/logger';

interface CreateFundInput {
  name: string;
  vintage_year: number;
  target_size_usd: number;
  status?: FundStatus;
}

interface UpdateFundInput {
  id: string;
  name: string;
  vintage_year: number;
  target_size_usd: number;
  status: FundStatus;
}

export const fundService = {
  async list(): Promise<Fund[]> {
    return prisma.fund.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async getById(id: string): Promise<Fund | null> {
    return prisma.fund.findUnique({
      where: { id }
    });
  },

  async create(data: CreateFundInput): Promise<Fund> {
    logger.info(
      {
        name: data.name,
        vintageYear: data.vintage_year,
        targetSizeUsd: data.target_size_usd
      },
      'Creating fund'
    );

    const fund = await prisma.fund.create({
      data: {
        name: data.name,
        vintageYear: data.vintage_year,
        targetSizeUsd: data.target_size_usd.toString(),
        status: data.status || 'Fundraising'
      }
    });

    logger.info(
      { fundId: fund.id, name: fund.name },
      'Fund created successfully'
    );

    return fund;
  },

  async update(data: UpdateFundInput): Promise<Fund> {
    logger.info({ fundId: data.id, status: data.status }, 'Updating fund');

    const fund = await prisma.fund.update({
      where: { id: data.id },
      data: {
        name: data.name,
        vintageYear: data.vintage_year,
        targetSizeUsd: data.target_size_usd.toString(),
        status: data.status
      }
    });

    logger.info(
      { fundId: fund.id, status: fund.status },
      'Fund updated successfully'
    );

    return fund;
  }
};
