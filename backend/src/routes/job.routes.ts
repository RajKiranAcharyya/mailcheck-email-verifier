import { Router } from 'express';
import multer from 'multer';
import { jobController } from '../controllers/job.controller';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createJobSchema,
  getJobParamsSchema,
  getJobItemsSchema,
} from '../schemas/validation.schema';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = Router();

/**
 * @openapi
 * /api/jobs/upload:
 *   post:
 *     summary: Upload CSV file for asynchronous bulk email verification
 *     tags: [Bulk Jobs]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The CSV file containing an email column
 *     responses:
 *       202:
 *         description: Bulk job accepted and processing
 *       400:
 *         description: Missing or invalid CSV
 */
router.post('/upload', upload.single('file'), jobController.uploadCsv);

/**
 * @openapi
 * /api/jobs:
 *   post:
 *     summary: Create bulk job via JSON list of emails
 *     tags: [Bulk Jobs]
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
 *               filename:
 *                 type: string
 *     responses:
 *       202:
 *         description: Bulk job created
 */
router.post('/', validateRequest(createJobSchema), jobController.createJob);

/**
 * @openapi
 * /api/jobs/{id}:
 *   get:
 *     summary: Get bulk job status and progress (polled by UI)
 *     tags: [Bulk Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job progress details
 *       404:
 *         description: Job not found
 */
router.get('/:id', validateRequest(getJobParamsSchema), jobController.getJob);

/**
 * @openapi
 * /api/jobs/{id}/items:
 *   get:
 *     summary: Get paginated results for a bulk job
 *     tags: [Bulk Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated job items
 */
router.get('/:id/items', validateRequest(getJobItemsSchema), jobController.getJobItems);

/**
 * @openapi
 * /api/jobs/{id}/export:
 *   get:
 *     summary: Export verified results of a bulk job as CSV
 *     tags: [Bulk Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV download
 */
router.get('/:id/export', validateRequest(getJobParamsSchema), jobController.exportCsv);

export default router;
