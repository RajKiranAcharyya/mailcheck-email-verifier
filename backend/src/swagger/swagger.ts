import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerOptions: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MailCheck - Email Verification API',
      version: '1.0.0',
      description:
        'Production REST API for high-accuracy email verification featuring two-level domain caching (24h TTL), disposable detection, role detection, MX lookup, typo suggestions, and asynchronous bulk CSV jobs with concurrency control.',
      contact: {
        name: 'MailCheck Engineering',
        url: 'https://github.com/RajKiranAcharyya/mailcheck-email-verifier',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: '/api',
        description: 'Current environment',
      },
    ],
    components: {
      schemas: {
        VerificationResult: {
          type: 'object',
          properties: {
            email: { type: 'string', example: 'alex@company.com' },
            user: { type: 'string', example: 'alex' },
            domain: { type: 'string', example: 'company.com' },
            status: { type: 'string', enum: ['valid', 'risky', 'invalid'], example: 'valid' },
            score: { type: 'number', example: 10, description: 'Risk score from 0 to 100' },
            checks: {
              type: 'object',
              properties: {
                syntax: {
                  type: 'object',
                  properties: {
                    valid: { type: 'boolean', example: true },
                    details: { type: 'string' },
                  },
                },
                disposable: {
                  type: 'object',
                  properties: {
                    isDisposable: { type: 'boolean', example: false },
                  },
                },
                roleBased: {
                  type: 'object',
                  properties: {
                    isRole: { type: 'boolean', example: false },
                    role: { type: 'string' },
                  },
                },
                mx: {
                  type: 'object',
                  properties: {
                    hasMx: { type: 'boolean', example: true },
                    records: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['aspmx.l.google.com'],
                    },
                    cached: { type: 'boolean', example: true },
                    cacheLevel: {
                      type: 'string',
                      enum: ['memory', 'database', 'none'],
                      example: 'memory',
                    },
                  },
                },
                freeProvider: {
                  type: 'object',
                  properties: {
                    isFree: { type: 'boolean', example: false },
                  },
                },
              },
            },
            suggestion: { type: 'string', nullable: true, example: null },
            processedAt: { type: 'string', format: 'date-time' },
          },
        },
        JobProgress: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            filename: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed', 'interrupted'],
            },
            progress: { type: 'number', example: 85 },
            total: { type: 'number', example: 100 },
            processed: { type: 'number', example: 85 },
            counts: {
              type: 'object',
              properties: {
                valid: { type: 'number', example: 70 },
                risky: { type: 'number', example: 10 },
                invalid: { type: 'number', example: 5 },
              },
            },
            errorMessage: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Input validation failed' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsDoc(swaggerOptions);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
