import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('API Endpoints Integration Tests', () => {
  let fundId: string;
  let investorId: string;

  beforeEach(async () => {
    const fund = await prisma.fund.create({
      data: {
        name: 'Test Fund',
        vintageYear: 2024,
        targetSizeUsd: '100000000',
        status: 'Fundraising'
      }
    });
    fundId = fund.id;

    const investor = await prisma.investor.create({
      data: {
        name: 'Test Investor',
        investorType: 'Institution',
        email: `test-${Date.now()}@example.com`
      }
    });
    investorId = investor.id;
  });

  afterEach(async () => {
    await prisma.investment.deleteMany({ where: { fundId } });
    await prisma.fund.delete({ where: { id: fundId } }).catch(() => {});
    await prisma.investor.delete({ where: { id: investorId } }).catch(() => {});
  });

  describe('GET /funds', () => {
    it('should return 200 with array of funds', async () => {
      const response = await request(app).get('/funds');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /funds', () => {
    it('should return 201 with created fund', async () => {
      const fundData = {
        name: `New Fund ${Date.now()}`,
        vintage_year: 2025,
        target_size_usd: 200000000,
        status: 'Fundraising'
      };

      const response = await request(app)
        .post('/funds')
        .set('Idempotency-Key', `api-test-fund-${Date.now()}`)
        .send(fundData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(fundData.name);
      expect(response.body.vintage_year).toBe(fundData.vintage_year);
      expect(response.body.target_size_usd).toBe('200000000.00');
      expect(response.body.status).toBe(fundData.status);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/funds')
        .set('Idempotency-Key', 'api-test-invalid')
        .send({
          name: 'Test',
          vintage_year: 1800,
          target_size_usd: -100
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /funds/:id', () => {
    it('should return 200 with fund data', async () => {
      const response = await request(app).get(`/funds/${fundId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(fundId);
      expect(response.body.name).toBe('Test Fund');
    });

    it('should return 404 for non-existent fund', async () => {
      const response = await request(app).get(
        '/funds/00000000-0000-0000-0000-000000000000'
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Fund not found');
    });
  });

  describe('PUT /funds', () => {
    it('should return 200 with updated fund', async () => {
      const updateData = {
        id: fundId,
        name: 'Updated Fund',
        vintage_year: 2024,
        target_size_usd: 150000000,
        status: 'Investing'
      };

      const response = await request(app).put('/funds').send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.status).toBe(updateData.status);
    });
  });

  describe('POST /investors', () => {
    it('should return 201 with created investor', async () => {
      const investorData = {
        name: `New Investor ${Date.now()}`,
        investor_type: 'Institution',
        email: `new-investor-${Date.now()}@example.com`
      };

      const response = await request(app)
        .post('/investors')
        .set('Idempotency-Key', `api-test-investor-${Date.now()}`)
        .send(investorData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(investorData.name);
      expect(response.body.investor_type).toBe(investorData.investor_type);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/investors')
        .set('Idempotency-Key', 'api-test-invalid-email')
        .send({
          name: 'Test',
          investor_type: 'Institution',
          email: 'not-an-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request data');
    });

    it('should return 409 for duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      await request(app)
        .post('/investors')
        .set('Idempotency-Key', 'api-test-duplicate-1')
        .send({
          name: 'First',
          investor_type: 'Institution',
          email
        });

      const response = await request(app)
        .post('/investors')
        .set('Idempotency-Key', 'api-test-duplicate-2')
        .send({
          name: 'Second',
          investor_type: 'Institution',
          email
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Resource already exists');
    });
  });

  describe('POST /funds/:fund_id/investments', () => {
    it('should return 201 with created investment', async () => {
      const investmentData = {
        investor_id: investorId,
        amount_usd: 50000000,
        investment_date: '2024-03-15'
      };

      const response = await request(app)
        .post(`/funds/${fundId}/investments`)
        .set('Idempotency-Key', `api-test-investment-${Date.now()}`)
        .send(investmentData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.amount_usd).toBe('50000000.00');
      expect(response.body.investment_date).toBe('2024-03-15');
      expect(response.body.fund_id).toBeDefined();
      expect(response.body.investor_id).toBe(investorId);
    });

    it('should return 404 for non-existent fund', async () => {
      const response = await request(app)
        .post('/funds/00000000-0000-0000-0000-000000000000/investments')
        .set('Idempotency-Key', 'api-test-investment-notfound')
        .send({
          investor_id: investorId,
          amount_usd: 50000000,
          investment_date: '2024-03-15'
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post(`/funds/${fundId}/investments`)
        .set('Idempotency-Key', 'api-test-investment-invalid-date')
        .send({
          investor_id: investorId,
          amount_usd: 50000000,
          investment_date: '2024/03/15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /funds/:fund_id/investments', () => {
    it('should return 200 with array of investments', async () => {
      await prisma.investment.create({
        data: {
          investorId,
          fundId,
          amountUsd: '50000000',
          investmentDate: new Date('2024-03-15')
        }
      });

      const response = await request(app).get(`/funds/${fundId}/investments`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Business Rule: Cannot invest in closed fund', () => {
    it('should return 400 when trying to invest in closed fund', async () => {
      const closedFund = await prisma.fund.create({
        data: {
          name: 'Closed Fund',
          vintageYear: 2024,
          targetSizeUsd: '100000000',
          status: 'Closed'
        }
      });

      const response = await request(app)
        .post(`/funds/${closedFund.id}/investments`)
        .set('Idempotency-Key', 'api-test-investment-closed-fund')
        .send({
          investor_id: investorId,
          amount_usd: 50000000,
          investment_date: '2024-03-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot invest in a closed fund');

      await prisma.fund.delete({ where: { id: closedFund.id } });
    });
  });
});
