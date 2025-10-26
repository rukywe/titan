import { Router } from 'express';
import { investorCreateSchema } from '../lib/validators';
import { transformInvestorToApi } from '../lib/transformers';
import { investorService } from '../services/investorService';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const investors = await investorService.list();
    return res.status(200).json(investors.map(transformInvestorToApi));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const validated = investorCreateSchema.parse(req.body);
    const investor = await investorService.create(validated);
    return res.status(201).json(transformInvestorToApi(investor));
  })
);

export { router as investorsRouter };
