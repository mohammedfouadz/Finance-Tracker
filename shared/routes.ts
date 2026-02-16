import { z } from 'zod';
import { 
  insertCategorySchema, 
  insertTransactionSchema, 
  insertGoalSchema, 
  insertBudgetSchema,
  categories,
  transactions,
  goals,
  budgets
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories' as const,
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/categories/:id' as const,
      input: insertCategorySchema.partial(),
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/categories/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions' as const,
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        categoryId: z.coerce.number().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions' as const,
      input: insertTransactionSchema,
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/transactions/:id' as const,
      input: insertTransactionSchema.partial(),
      responses: {
        200: z.custom<typeof transactions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/transactions/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals' as const,
      responses: {
        200: z.array(z.custom<typeof goals.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals' as const,
      input: insertGoalSchema,
      responses: {
        201: z.custom<typeof goals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/goals/:id' as const,
      input: insertGoalSchema.partial(),
      responses: {
        200: z.custom<typeof goals.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/goals/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  budgets: {
    list: {
      method: 'GET' as const,
      path: '/api/budgets' as const,
      input: z.object({
        month: z.coerce.number(),
        year: z.coerce.number(),
      }),
      responses: {
        200: z.array(z.custom<typeof budgets.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/budgets' as const,
      input: insertBudgetSchema,
      responses: {
        201: z.custom<typeof budgets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/budgets/:id' as const,
      input: insertBudgetSchema.partial(),
      responses: {
        200: z.custom<typeof budgets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  ai: {
    insights: {
      method: 'POST' as const,
      path: '/api/ai/insights' as const,
      input: z.object({
        query: z.string().optional(),
      }),
      responses: {
        200: z.object({
          insight: z.string(),
          recommendations: z.array(z.string()),
        }),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
