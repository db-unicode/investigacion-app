import { cors } from 'hono/cors';
import 'dotenv/config';
import { OpenAPIHono } from '@hono/zod-openapi';
import { serve } from '@hono/node-server';
import { createDbContext } from '../infrastructure/db/client';
import {
  createEnrollmentRepository,
} from '../infrastructure/repositories/enrollment-repository';
import {
  createCourseHistoryService,
} from '../domain/services/course-history-service';
import {
  createGetCourseHistoryUseCase,
} from '../application/use-cases/get-course-history.use-case';
import {
  createCourseHistoryController,
} from './controllers/course-history-controller';
import {
  registerPotentialStudentsForecastRoute,
} from './controllers/forecasts/potential-students-by-prerequisites.controller';
import {
  registerForecastAccuracyRoute,
} from './controllers/forecasts/forecast-accuracy.controller';
import {
  registerForecastMethodsRoute,
} from './controllers/forecasts/forecast-methods.controller';
import {
  registerPassRateAdjustedForecastRoute,
} from './controllers/forecasts/pass-rate-adjusted.controller';
import {
  registerSectionStatsRoute,
} from './controllers/section-stats.controller';

const DEFAULT_PORT = 3000;
const PORT_ENV_VAR = 'PORT';
const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:5173';
const ALLOWED_ORIGIN_ENV_VAR = 'ALLOWED_ORIGIN';

const dbContext = createDbContext();
const enrollmentRepository = createEnrollmentRepository(
  dbContext.dbClient,
);
const courseHistoryService = createCourseHistoryService();
const getCourseHistoryUseCase = createGetCourseHistoryUseCase(
  enrollmentRepository,
  courseHistoryService,
);

/**
 * Creates and configures the HTTP application.
 */
const createHttpApp = (): OpenAPIHono => {
  const app = new OpenAPIHono();

  app.use(
    '*',
    cors({
      origin:
        process.env[ALLOWED_ORIGIN_ENV_VAR] ?? DEFAULT_ALLOWED_ORIGIN,
    }),
  );

  app.get('/health', (context) => {
    return context.json({ status: 'ok' });
  });

  // Course history routes (already existing).
  app.route(
    '/',
    createCourseHistoryController(getCourseHistoryUseCase),
  );

  // Forecast routes: potential students by prerequisites.
  registerPotentialStudentsForecastRoute(app);

  // Forecast routes: pass rate adjusted (calibrated).
  registerPassRateAdjustedForecastRoute(app);

  // Forecast accuracy & backtesting routes.
  registerForecastAccuracyRoute(app);

  // Forecast methods routes.
  registerForecastMethodsRoute(app);

  // Section stats routes.
  registerSectionStatsRoute(app);

  return app;
};

const app = createHttpApp();
const portFromEnv = Number(process.env[PORT_ENV_VAR] ?? DEFAULT_PORT);

serve({
  fetch: app.fetch,
  port: portFromEnv,
});

// eslint-disable-next-line no-console
console.log(`Backend listening on http://localhost:${portFromEnv}`);

process.on('SIGINT', () => {
  dbContext.sqlite.close();
  process.exit(0);
});
