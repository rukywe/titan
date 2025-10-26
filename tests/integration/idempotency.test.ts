import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Idempotency Tests', () => {
  describe('POST /funds', () => {
    it('should return same response for duplicate idempotency keys', async () => {
      const idempotencyKey = `test-fund-${Date.now()}`;
      const fundData = {
        name: `Test Fund ${Date.now()}`,
        vintage_year: 2025,
        target_size_usd: 100000000,
        status: 'Fundraising'
      };

      const firstResponse = await request(app)
        .post('/funds')
        .set('Idempotency-Key', idempotencyKey)
        .send(fundData);

      expect(firstResponse.status).toBe(201);
      expect(firstResponse.body.id).toBeDefined();

      const secondResponse = await request(app)
        .post('/funds')
        .set('Idempotency-Key', idempotencyKey)
        .send(fundData);

      expect(secondResponse.status).toBe(201);
      expect(secondResponse.body.id).toBe(firstResponse.body.id);
      expect(secondResponse.body).toEqual(firstResponse.body);

      // Cleanup
      await prisma.fund.delete({ where: { id: firstResponse.body.id } });
    });

    it('should allow different requests with different keys', async () => {
      const fundData = {
        name: `Test Fund ${Date.now()}`,
        vintage_year: 2025,
        target_size_usd: 100000000,
        status: 'Fundraising'
      };

      const response1 = await request(app)
        .post('/funds')
        .set('Idempotency-Key', 'key-1')
        .send(fundData);

      const response2 = await request(app)
        .post('/funds')
        .set('Idempotency-Key', 'key-2')
        .send(fundData);

      expect(response1.body.id).not.toBe(response2.body.id);

      // Cleanup
      await prisma.fund.deleteMany({
        where: { id: { in: [response1.body.id, response2.body.id] } }
      });
    });
  });

  describe('POST /investors', () => {
    it('should return same response for duplicate idempotency keys', async () => {
      const timestamp = Date.now();
      const idempotencyKey = `test-investor-${timestamp}`;
      const investorData = {
        name: 'Test Investor',
        investor_type: 'Institution',
        email: `test-${timestamp}@example.com`
      };

      const firstResponse = await request(app)
        .post('/investors')
        .set('Idempotency-Key', idempotencyKey)
        .send(investorData);

      expect(firstResponse.status).toBe(201);
      expect(firstResponse.body.id).toBeDefined();

      const secondResponse = await request(app)
        .post('/investors')
        .set('Idempotency-Key', idempotencyKey)
        .send(investorData);

      expect(secondResponse.status).toBe(201);
      expect(secondResponse.body.id).toBe(firstResponse.body.id);

      // Cleanup
      await prisma.investor.delete({ where: { id: firstResponse.body.id } });
    });
  });

  describe('POST /funds/:fund_id/investments', () => {
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
      await prisma.fund.delete({ where: { id: fundId } });
      await prisma.investor.delete({ where: { id: investorId } });
    });

    it('should return same response for duplicate idempotency keys', async () => {
      const idempotencyKey = `test-investment-${Date.now()}`;
      const investmentData = {
        investor_id: investorId,
        amount_usd: 50000000,
        investment_date: '2024-03-15'
      };

      const firstResponse = await request(app)
        .post(`/funds/${fundId}/investments`)
        .set('Idempotency-Key', idempotencyKey)
        .send(investmentData);

      expect(firstResponse.status).toBe(201);
      expect(firstResponse.body.id).toBeDefined();

      const secondResponse = await request(app)
        .post(`/funds/${fundId}/investments`)
        .set('Idempotency-Key', idempotencyKey)
        .send(investmentData);

      expect(secondResponse.status).toBe(201);
      expect(secondResponse.body.id).toBe(firstResponse.body.id);
      expect(secondResponse.body).toEqual(firstResponse.body);
    });

    it('should allow different requests with different keys', async () => {
      const investmentData = {
        investor_id: investorId,
        amount_usd: 50000000,
        investment_date: '2024-03-15'
      };

      const response1 = await request(app)
        .post(`/funds/${fundId}/investments`)
        .set('Idempotency-Key', 'key-1')
        .send(investmentData);

      const response2 = await request(app)
        .post(`/funds/${fundId}/investments`)
        .set('Idempotency-Key', 'key-2')
        .send(investmentData);

      expect(response1.body.id).not.toBe(response2.body.id);
    });
  });

  describe('Idempotency-Key header is optional', () => {
    it('should work without idempotency key', async () => {
      const fundData = {
        name: `Test Fund ${Date.now()}`,
        vintage_year: 2025,
        target_size_usd: 100000000,
        status: 'Fundraising'
      };

      const response = await request(app).post('/funds').send(fundData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();

      // Cleanup
      await prisma.fund.delete({ where: { id: response.body.id } });
    });
  });
});
