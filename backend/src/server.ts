import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { runMigrations } from './database/db';
import { jobService } from './services/job.service';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    console.log('[Server] Initializing database migrations...');
    await runMigrations();
    console.log('[Server] Migrations applied successfully.');

    // Startup recovery for interrupted jobs
    console.log('[Server] Running startup recovery check for interrupted bulk jobs...');
    const recoveredCount = await jobService.recoverInterruptedJobs();
    if (recoveredCount > 0) {
      console.log(`[Server] Startup recovery: successfully recovered and failed ${recoveredCount} interrupted job(s).`);
    } else {
      console.log('[Server] Startup recovery: clean boot, no interrupted jobs found.');
    }

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`[Server] MailCheck API listening on port ${PORT}`);
      console.log(`[Server] API Docs available at http://localhost:${PORT}/api-docs`);
      console.log(`[Server] Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('[Server] Fatal error during server startup:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
