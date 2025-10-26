import { Router } from 'express';
import { investmentCreateSchema } from '../lib/validators';
import { transformInvestmentToApi } from '../lib/transformers';
import { investmentService } from '../services/investmentService';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

router.get(
  '/:fund_id/investments',
  asyncHandler(async (req, res) => {
    const fundId = req.params['fund_id'];
    if (!fundId) {
      return res.status(400).json({ error: 'Fund ID required' });
    }

    const investments = await investmentService.listByFund(fundId);
    return res.status(200).json(investments.map(transformInvestmentToApi));
  })
);

router.post(
  '/:fund_id/investments',
  asyncHandler(async (req, res) => {
    const fundId = req.params['fund_id'];
    if (!fundId) {
      return res.status(400).json({ error: 'Fund ID required' });
    }

    const validated = investmentCreateSchema.parse(req.body);
    const investment = await investmentService.create(fundId, validated);
    return res.status(201).json(transformInvestmentToApi(investment));
  })
);

export { router as investmentsRouter };
