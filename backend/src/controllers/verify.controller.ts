import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/verification.service';

export class VerifyController {
  /**
   * Verifies a single email address.
   */
  async verifySingle(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.body?.email || (req.query?.email as string);
      const result = await verificationService.verify(email);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quick synchronous batch verification for small lists (up to 25 emails).
   */
  async verifyBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const emails: string[] = req.body.emails || [];
      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Must provide an array of emails',
          },
        });
      }

      if (emails.length > 25) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BATCH_LIMIT_EXCEEDED',
            message: 'Synchronous batch limit is 25 emails. Please use bulk jobs for larger lists.',
          },
        });
      }

      const results = await Promise.all(emails.map((e) => verificationService.verify(e)));

      return res.status(200).json({
        success: true,
        data: {
          total: results.length,
          results,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const verifyController = new VerifyController();
