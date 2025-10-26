import { Router } from 'express';
import { fundCreateSchema, fundUpdateSchema } from '../lib/validators';
import { transformFundToApi } from '../lib/transformers';
import { fundService } from '../services/fundService';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const funds = await fundService.list();
    return res.status(200).json(funds.map(transformFundToApi));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params['id'];
    if (!id) {
      return res.status(400).json({ error: 'Fund ID required' });
    }

    const fund = await fundService.getById(id);

    if (!fund) {
      return res.status(404).json({ error: 'Fund not found' });
    }

    return res.status(200).json(transformFundToApi(fund));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const validated = fundCreateSchema.parse(req.body);
    const fund = await fundService.create(validated);
    return res.status(201).json(transformFundToApi(fund));
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const validated = fundUpdateSchema.parse(req.body);
    const fund = await fundService.update(validated);
    return res.status(200).json(transformFundToApi(fund));
  })
);

export { router as fundsRouter };
