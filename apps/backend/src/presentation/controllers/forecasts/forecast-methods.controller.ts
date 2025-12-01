import { z } from 'zod';
import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import {
  forecastMethodDtoSchema,
  forecastMethodListSchema,
  methodCategorySchema,
  methodStatusSchema,
} from '@app/contracts';
import { GetForecastMethodsUseCase } from '../../../application/use-cases/forecasts/get-forecast-methods.use-case';
import { forecastMethodRegistry } from '../../../domain/forecasts/forecast-method-registry.singleton';

// List all methods route
const listMethodsRoute = createRoute({
  method: 'get',
  path: '/api/forecasts/methods',
  request: {
    query: z.object({
      category: methodCategorySchema.optional(),
      status: methodStatusSchema.optional(),
      backtesting: z
        .string()
        .transform(val => val === 'true')
        .optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of available forecast methods',
      content: {
        'application/json': {
          schema: forecastMethodListSchema,
        },
      },
    },
  },
  tags: ['Forecasts', 'Methods'],
});

// Get single method route
const getMethodRoute = createRoute({
  method: 'get',
  path: '/api/forecasts/methods/{methodId}',
  request: {
    params: z.object({
      methodId: z.string().min(1),
    }),
  },
  responses: {
    200: {
      description: 'Forecast method details',
      content: {
        'application/json': {
          schema: forecastMethodDtoSchema,
        },
      },
    },
    404: {
      description: 'Method not found',
    },
  },
  tags: ['Forecasts', 'Methods'],
});

export const registerForecastMethodsRoute = (app: OpenAPIHono): void => {
  const useCase = new GetForecastMethodsUseCase({
    registry: forecastMethodRegistry,
  });

  // List methods
  app.openapi(listMethodsRoute, async c => {
    const { category, status, backtesting } = c.req.valid('query');

    const result = useCase.execute({
      category: category as
        | 'prerequisite-based'
        | 'historical-trend'
        | 'machine-learning'
        | undefined,
      status: status as 'active' | 'beta' | 'deprecated' | undefined,
      supportsBacktesting: backtesting,
    });

    return c.json(result, 200);
  });

  // Get single method
  app.openapi(getMethodRoute, async c => {
    const { methodId } = c.req.valid('param');

    const result = useCase.executeById(methodId);

    if (!result) {
      return c.json(
        {
          error: {
            code: 'METHOD_NOT_FOUND',
            message: `Forecast method '${methodId}' not found`,
          },
        },
        404,
      );
    }

    return c.json(result, 200);
  });
};
