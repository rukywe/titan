import { Fund, Investor, Investment, InvestorType } from '@prisma/client';

export function transformFundToApi(fund: Fund) {
  return {
    id: fund.id,
    name: fund.name,
    vintage_year: fund.vintageYear,
    target_size_usd: fund.targetSizeUsd.toFixed(2),
    status: fund.status,
    created_at: fund.createdAt.toISOString()
  };
}

export function transformInvestorToApi(investor: Investor) {
  return {
    id: investor.id,
    name: investor.name,
    investor_type:
      investor.investorType === 'FamilyOffice'
        ? 'Family Office'
        : investor.investorType,
    email: investor.email,
    created_at: investor.createdAt.toISOString()
  };
}

export function transformInvestmentToApi(investment: Investment) {
  return {
    id: investment.id,
    investor_id: investment.investorId,
    fund_id: investment.fundId,
    amount_usd: investment.amountUsd.toFixed(2),
    investment_date: investment.investmentDate.toISOString().split('T')[0]
  };
}

export function transformInvestorTypeFromApi(type: string): InvestorType {
  const normalised = type.replace(/\s+/g, '');
  if (normalised === 'FamilyOffice' || normalised === 'Family Office') {
    return 'FamilyOffice';
  }
  if (normalised === 'Institution') return 'Institution';
  if (normalised === 'Individual') return 'Individual';
  throw new Error(`Invalid investor type: ${type}`);
}
