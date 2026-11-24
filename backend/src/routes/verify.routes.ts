import { Router } from 'express';
import { verifyController } from '../controllers/verify.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { verifyEmailSchema, verifyQuerySchema } from '../schemas/validation.schema';

const router = Router();

/**
 * @openapi
 * /api/verify:
 *   post:
 *     summary: Verify a single email address
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification result
 *       400:
 *         description: Validation error
 */
router.post('/', validateRequest(verifyEmailSchema), verifyController.verifySingle);

/**
 * @openapi
 * /api/verify:
 *   get:
 *     summary: Verify an email via query parameter
 *     tags: [Verification]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification result
 */
router.get('/', validateRequest(verifyQuerySchema), verifyController.verifySingle);

/**
 * @openapi
 * /api/verify/batch:
 *   post:
 *     summary: Verify a small batch of emails synchronously (max 25)
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emails]
 *             properties:
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Batch verification result
 */
router.post('/batch', verifyController.verifyBatch);

export default router;
