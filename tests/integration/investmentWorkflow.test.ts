import { prisma } from '../../src/lib/prisma';
import { fundService } from '../../src/services/fundService';
import { investorService } from '../../src/services/investorService';
import { investmentService } from '../../src/services/investmentService';

describe('Investment Workflow Integration Test', () => {
  let fundId: string;
  let investorId: string;

  beforeAll(async () => {
    const fund = await fundService.create({
      name: 'Test Fund',
      vintage_year: 2024,
      target_size_usd: 100000000,
      status: 'Fundraising'
    });
    fundId = fund.id;

    const investor = await investorService.create({
      name: 'Test Investor',
      investor_type: 'Institution',
      email: `test-${Date.now()}@example.com`
    });
    investorId = investor.id;
  });

  afterAll(async () => {
    await prisma.investment.deleteMany({
      where: { fundId }
    });
    await prisma.fund.delete({ where: { id: fundId } });
    await prisma.investor.delete({ where: { id: investorId } });
  });

  it('should create an investment successfully', async () => {
    const investment = await investmentService.create(fundId, {
      investor_id: investorId,
      amount_usd: 50000000,
      investment_date: '2024-03-15'
    });

    expect(investment).toBeDefined();
    expect(investment.fundId).toBe(fundId);
    expect(investment.investorId).toBe(investorId);
  });

  it('should list investments for a fund', async () => {
    const investments = await investmentService.listByFund(fundId);

    expect(investments).toBeDefined();
    expect(investments.length).toBeGreaterThan(0);
    expect(investments[0]?.fundId).toBe(fundId);
  });

  it('should prevent investing in a closed fund', async () => {
    await fundService.update({
      id: fundId,
      name: 'Test Fund',
      vintage_year: 2024,
      target_size_usd: 100000000,
      status: 'Closed'
    });

    await expect(
      investmentService.create(fundId, {
        investor_id: investorId,
        amount_usd: 50000000,
        investment_date: '2024-03-15'
      })
    ).rejects.toThrow('Cannot invest in a closed fund');
  });
});
