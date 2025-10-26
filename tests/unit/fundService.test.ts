import { Fund, FundStatus } from '@prisma/client';
import { fundService } from '../../src/services/fundService';
import { prisma } from '../../src/lib/prisma';

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    fund: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}));

describe('FundService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return all funds', async () => {
      const mockFunds: Fund[] = [
        {
          id: '1',
          name: 'Test Fund',
          vintageYear: 2024,
          targetSizeUsd: { toString: () => '100000000' } as any,
          status: FundStatus.Fundraising,
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (prisma.fund.findMany as jest.Mock).mockResolvedValue(mockFunds);

      const result = await fundService.list();

      expect(result).toEqual(mockFunds);
      expect(prisma.fund.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('create', () => {
    it('should create a fund with Fundraising status by default', async () => {
      const input = {
        name: 'Test Fund',
        vintage_year: 2024,
        target_size_usd: 100000000
      };

      const mockFund: Fund = {
        id: '1',
        name: 'Test Fund',
        vintageYear: 2024,
        targetSizeUsd: { toString: () => '100000000' } as any,
        status: FundStatus.Fundraising,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.fund.create as jest.Mock).mockResolvedValue(mockFund);

      const result = await fundService.create(input);

      expect(result).toEqual(mockFund);
      expect(prisma.fund.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Fund',
          vintageYear: 2024,
          targetSizeUsd: '100000000',
          status: 'Fundraising'
        }
      });
    });

    it('should create a fund with specified status', async () => {
      const input = {
        name: 'Test Fund',
        vintage_year: 2024,
        target_size_usd: 100000000,
        status: FundStatus.Investing
      };

      const mockFund: Fund = {
        id: '1',
        name: 'Test Fund',
        vintageYear: 2024,
        targetSizeUsd: { toString: () => '100000000' } as any,
        status: FundStatus.Investing,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.fund.create as jest.Mock).mockResolvedValue(mockFund);

      const result = await fundService.create(input);

      expect(result).toEqual(mockFund);
      expect(prisma.fund.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Fund',
          vintageYear: 2024,
          targetSizeUsd: '100000000',
          status: FundStatus.Investing
        }
      });
    });
  });

  describe('update', () => {
    it('should update a fund', async () => {
      const input = {
        id: '1',
        name: 'Updated Fund',
        vintage_year: 2024,
        target_size_usd: 200000000,
        status: FundStatus.Investing
      };

      const mockFund: Fund = {
        id: '1',
        name: 'Updated Fund',
        vintageYear: 2024,
        targetSizeUsd: { toString: () => '200000000' } as any,
        status: FundStatus.Investing,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.fund.update as jest.Mock).mockResolvedValue(mockFund);

      const result = await fundService.update(input);

      expect(result).toEqual(mockFund);
      expect(prisma.fund.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Fund',
          vintageYear: 2024,
          targetSizeUsd: '200000000',
          status: FundStatus.Investing
        }
      });
    });
  });
});
