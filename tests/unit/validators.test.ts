import {
  fundCreateSchema,
  investorCreateSchema,
  investmentCreateSchema
} from '../../src/lib/validators';

describe('Validation Schemas', () => {
  describe('fundCreateSchema', () => {
    it('should validate valid fund creation data', () => {
      const valid = {
        name: 'Test Fund',
        vintage_year: 2024,
        target_size_usd: 100000000,
        status: 'Fundraising'
      };

      expect(() => fundCreateSchema.parse(valid)).not.toThrow();
    });

    it('should reject negative target size', () => {
      const invalid = {
        name: 'Test Fund',
        vintage_year: 2024,
        target_size_usd: -1000000,
        status: 'Fundraising'
      };

      expect(() => fundCreateSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid vintage year range', () => {
      const invalid = {
        name: 'Test Fund',
        vintage_year: 1800,
        target_size_usd: 100000000,
        status: 'Fundraising'
      };

      expect(() => fundCreateSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid status', () => {
      const invalid = {
        name: 'Test Fund',
        vintage_year: 2024,
        target_size_usd: 100000000,
        status: 'InvalidStatus'
      };

      expect(() => fundCreateSchema.parse(invalid)).toThrow();
    });
  });

  describe('investorCreateSchema', () => {
    it('should validate valid investor creation data', () => {
      const valid = {
        name: 'Test Investor',
        investor_type: 'Institution',
        email: 'test@example.com'
      };

      expect(() => investorCreateSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const invalid = {
        name: 'Test Investor',
        investor_type: 'Institution',
        email: 'not-an-email'
      };

      expect(() => investorCreateSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid investor type', () => {
      const invalid = {
        name: 'Test Investor',
        investor_type: 'InvalidType',
        email: 'test@example.com'
      };

      expect(() => investorCreateSchema.parse(invalid)).toThrow();
    });
  });

  describe('investmentCreateSchema', () => {
    it('should validate valid investment creation data', () => {
      const valid = {
        investor_id: '550e8400-e29b-41d4-a716-446655440000',
        amount_usd: 50000000,
        investment_date: '2024-03-15'
      };

      expect(() => investmentCreateSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid date format', () => {
      const invalid = {
        investor_id: '550e8400-e29b-41d4-a716-446655440000',
        amount_usd: 50000000,
        investment_date: '2024/03/15'
      };

      expect(() => investmentCreateSchema.parse(invalid)).toThrow();
    });

    it('should reject negative amount', () => {
      const invalid = {
        investor_id: '550e8400-e29b-41d4-a716-446655440000',
        amount_usd: -50000000,
        investment_date: '2024-03-15'
      };

      expect(() => investmentCreateSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalid = {
        investor_id: 'not-a-uuid',
        amount_usd: 50000000,
        investment_date: '2024-03-15'
      };

      expect(() => investmentCreateSchema.parse(invalid)).toThrow();
    });
  });
});
