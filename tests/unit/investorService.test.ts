import { Investor, InvestorType } from '@prisma/client';
import { investorService } from '../../src/services/investorService';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    investor: {
      findMany: jest.fn(),
      create: jest.fn()
    }
  }
}));

describe('InvestorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return all investors', async () => {
      const mockInvestors: Investor[] = [
        {
          id: '1',
          name: 'Test Investor',
          investorType: InvestorType.Institution,
          email: 'test@example.com',
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (prisma.investor.findMany as jest.Mock).mockResolvedValue(mockInvestors);

      const result = await investorService.list();

      expect(result).toEqual(mockInvestors);
      expect(prisma.investor.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('create', () => {
    it('should create an institution investor', async () => {
      const input = {
        name: 'Test Investor',
        investor_type: 'Institution',
        email: 'test@example.com'
      };

      const mockInvestor: Investor = {
        id: '1',
        name: 'Test Investor',
        investorType: InvestorType.Institution,
        email: 'test@example.com',
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.investor.create as jest.Mock).mockResolvedValue(mockInvestor);

      const result = await investorService.create(input);

      expect(result).toEqual(mockInvestor);
      expect(prisma.investor.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Investor',
          investorType: InvestorType.Institution,
          email: 'test@example.com'
        }
      });
    });

    it('should map Family Office to FamilyOffice enum', async () => {
      const input = {
        name: 'Test Investor',
        investor_type: 'Family Office',
        email: 'test@example.com'
      };

      const mockInvestor: Investor = {
        id: '1',
        name: 'Test Investor',
        investorType: InvestorType.FamilyOffice,
        email: 'test@example.com',
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.investor.create as jest.Mock).mockResolvedValue(mockInvestor);

      const result = await investorService.create(input);

      expect(result).toEqual(mockInvestor);
      expect(prisma.investor.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Investor',
          investorType: InvestorType.FamilyOffice,
          email: 'test@example.com'
        }
      });
    });

    it('should throw error for invalid investor type', async () => {
      const input = {
        name: 'Test Investor',
        investor_type: 'InvalidType',
        email: 'test@example.com'
      };

      await expect(investorService.create(input)).rejects.toThrow(
        'Invalid investor type'
      );
    });
  });
});
