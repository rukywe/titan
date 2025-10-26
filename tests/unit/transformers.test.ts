import { Fund, Investor, Investment, Prisma } from '@prisma/client';
import {
  transformFundToApi,
  transformInvestorToApi,
  transformInvestmentToApi,
  transformInvestorTypeFromApi
} from '../../src/lib/transformers';

describe('Transformers', () => {
  const mockFund: Fund = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Fund',
    vintageYear: 2024,
    targetSizeUsd: new Prisma.Decimal('250000000'),
    status: 'Fundraising',
    version: 0,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  };

  const mockInvestor: Investor = {
    id: '770e8400-e29b-41d4-a716-446655440002',
    name: 'Test Investor',
    investorType: 'Institution',
    email: 'test@example.com',
    version: 0,
    createdAt: new Date('2024-02-10T09:15:00Z'),
    updatedAt: new Date('2024-02-10T09:15:00Z')
  };

  const mockInvestment: Investment = {
    id: '990e8400-e29b-41d4-a716-446655440004',
    investorId: '770e8400-e29b-41d4-a716-446655440002',
    fundId: '550e8400-e29b-41d4-a716-446655440000',
    amountUsd: new Prisma.Decimal('50000000'),
    investmentDate: new Date('2024-03-15'),
    version: 0,
    createdAt: new Date('2024-03-15T10:00:00Z'),
    updatedAt: new Date('2024-03-15T10:00:00Z')
  };

  describe('transformFundToApi', () => {
    it('should transform fund to API format', () => {
      const result = transformFundToApi(mockFund);

      expect(result.id).toBe(mockFund.id);
      expect(result.name).toBe(mockFund.name);
      expect(result.vintage_year).toBe(mockFund.vintageYear);
      expect(result.target_size_usd).toBe('250000000.00');
      expect(result.status).toBe(mockFund.status);
      expect(result.created_at).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should format decimal with two places', () => {
      const fund: Fund = {
        ...mockFund,
        targetSizeUsd: new Prisma.Decimal('1000000')
      };
      const result = transformFundToApi(fund);
      expect(result.target_size_usd).toBe('1000000.00');
    });

    it('should handle zero values', () => {
      const fund: Fund = {
        ...mockFund,
        targetSizeUsd: new Prisma.Decimal('0')
      };
      const result = transformFundToApi(fund);
      expect(result.target_size_usd).toBe('0.00');
    });
  });

  describe('transformInvestorToApi', () => {
    it('should transform investor to API format', () => {
      const result = transformInvestorToApi(mockInvestor);

      expect(result.id).toBe(mockInvestor.id);
      expect(result.name).toBe(mockInvestor.name);
      expect(result.investor_type).toBe('Institution');
      expect(result.email).toBe(mockInvestor.email);
      expect(result.created_at).toBe('2024-02-10T09:15:00.000Z');
    });

    it('should map FamilyOffice enum to "Family Office" string', () => {
      const familyOfficeInvestor: Investor = {
        ...mockInvestor,
        investorType: 'FamilyOffice'
      };
      const result = transformInvestorToApi(familyOfficeInvestor);
      expect(result.investor_type).toBe('Family Office');
    });

    it('should handle Individual investor type', () => {
      const individualInvestor: Investor = {
        ...mockInvestor,
        investorType: 'Individual'
      };
      const result = transformInvestorToApi(individualInvestor);
      expect(result.investor_type).toBe('Individual');
    });
  });

  describe('transformInvestmentToApi', () => {
    it('should transform investment to API format', () => {
      const result = transformInvestmentToApi(mockInvestment);

      expect(result.id).toBe(mockInvestment.id);
      expect(result.investor_id).toBe(mockInvestment.investorId);
      expect(result.fund_id).toBe(mockInvestment.fundId);
      expect(result.amount_usd).toBe('50000000.00');
      expect(result.investment_date).toBe('2024-03-15');
    });

    it('should format amount with two decimal places', () => {
      const investment: Investment = {
        ...mockInvestment,
        amountUsd: new Prisma.Decimal('75000000.50')
      };
      const result = transformInvestmentToApi(investment);
      expect(result.amount_usd).toBe('75000000.50');
    });

    it('should extract date without time', () => {
      const investment: Investment = {
        ...mockInvestment,
        investmentDate: new Date('2024-03-15T18:30:45Z')
      };
      const result = transformInvestmentToApi(investment);
      expect(result.investment_date).toBe('2024-03-15');
    });
  });

  describe('transformInvestorTypeFromApi', () => {
    it('should map "Individual" to InvestorType', () => {
      const result = transformInvestorTypeFromApi('Individual');
      expect(result).toBe('Individual');
    });

    it('should map "Institution" to InvestorType', () => {
      const result = transformInvestorTypeFromApi('Institution');
      expect(result).toBe('Institution');
    });

    it('should map "Family Office" to FamilyOffice enum', () => {
      const result = transformInvestorTypeFromApi('Family Office');
      expect(result).toBe('FamilyOffice');
    });

    it('should map "FamilyOffice" to FamilyOffice enum', () => {
      const result = transformInvestorTypeFromApi('FamilyOffice');
      expect(result).toBe('FamilyOffice');
    });

    it('should throw error for invalid type', () => {
      expect(() => transformInvestorTypeFromApi('InvalidType')).toThrow(
        'Invalid investor type: InvalidType'
      );
    });
  });
});
