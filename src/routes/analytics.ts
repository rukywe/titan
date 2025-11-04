import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';

const router = Router();

router.get(
    '/:fund_id/analytics',
    asyncHandler(async (req, res) => {
        const fundId = req.params['fund_id'];

        if (!fundId) {
            return res.status(400).json({ error: 'Fund ID required' });
        }

        // Fetch fund data
        const fund = await prisma.fund.findUnique({
            where: { id: fundId }
        });

        if (!fund) {
            throw new NotFoundError('Fund not found');
        }

        // Fetch investments for this fund
        const investments = await prisma.investment.findMany({
            where: { fundId: fundId }
        });

        // Fetch investor details for each investment
        const investorsData = [];
        for (const investment of investments) {
            const investor = await prisma.investor.findUnique({
                where: { id: investment.investorId }
            });
            if (investor) {
                investorsData.push({
                    investor_id: investor.id,
                    investor_name: investor.name,
                    investor_type: investor.investorType === 'FamilyOffice' ? 'Family Office' : investor.investorType,
                    amount: parseFloat(investment.amountUsd.toString())
                });
            }
        }

        // Calculate total raised
        let totalRaised = 0;
        for (let i = 0; i < investorsData.length; i++) {
            totalRaised = totalRaised + investorsData[i].amount;
        }

        // Calculate utilization percentage
        const targetSize = parseFloat(fund.targetSizeUsd.toString());
        const utilizationPct = (totalRaised / targetSize) * 100;

        // Calculate average investment
        const avgInvestment = totalRaised / investments.length;

        // Group by investor type
        const byType: Record<string, { count: number; total: number }> = {};
        investorsData.forEach(inv => {
            const type = inv.investor_type;
            if (!byType[type]) {
                byType[type] = { count: 0, total: 0 };
            }
            byType[type].count++;
            byType[type].total += inv.amount;
        });

        // Format by_investor_type with percentages
        const byInvestorType: Record<string, { count: number; total: number; percentage: number }> = {};
        for (const type in byType) {
            byInvestorType[type] = {
                count: byType[type].count,
                total: parseFloat(byType[type].total.toFixed(2)),
                percentage: parseFloat(((byType[type].total / totalRaised) * 100).toFixed(1))
            };
        }

        // Calculate top investors by grouping investments per investor
        const investorTotals = investorsData.reduce((acc: Record<string, { name: string; total: number }>, inv) => {
            if (!acc[inv.investor_id]) {
                acc[inv.investor_id] = { name: inv.investor_name, total: 0 };
            }
            acc[inv.investor_id].total += inv.amount;
            return acc;
        }, {});

        // Sort and get top 5
        const topInvestorsArray = Object.entries(investorTotals).map(([id, data]) => ({
            investor_id: id,
            investor_name: data.name,
            total_invested: data.total,
            percentage: (data.total / totalRaised) * 100
        }));

        topInvestorsArray.sort((a, b) => b.total_invested - a.total_invested);

        const topInvestors = topInvestorsArray.slice(0, 5).map((inv, index) => ({
            investor_id: inv.investor_id,
            investor_name: inv.investor_name,
            total_invested: parseFloat(inv.total_invested.toFixed(2)),
            percentage: parseFloat(inv.percentage.toFixed(1)),
            rank: index + 1
        }));

        const totalManagementFee = totalRaised * 0.02;

        const feesByInvestor = allocateManagementFees(
            totalManagementFee,
            investorsData
        );

        // Format response
        return res.status(200).json({
            fund_id: fund.id,
            total_raised: parseFloat(totalRaised.toFixed(2)),
            target_size: targetSize,
            utilization_pct: parseFloat(utilizationPct.toFixed(1)),
            investor_count: investorsData.length,
            average_investment: parseFloat(avgInvestment.toFixed(2)),
            top_investors: topInvestors,
            by_investor_type: byInvestorType,
            fee_distribution: {
                total_management_fee: parseFloat(totalManagementFee.toFixed(2)),
                by_investor: feesByInvestor
            }
        });
    })
);

export { router as analyticsRouter };

/**
 * TODO: DO THIS FUNCTION LATER
 */
function allocateManagementFees(
    totalFeeAmount: number,
    investments: Array<{ investor_id: string; investor_name: string; amount: number }>
): Array<{ investor_id: string; investor_name: string; fee: number; percentage: number }> {
    return [];
}

