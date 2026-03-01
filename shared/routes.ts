import { z } from 'zod';
import { insertFamilySchema, insertUserSchema, insertChoreSchema, insertRewardSchema, families, users, chores, rewards, choreLogs, messages } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  families: {
    create: {
      method: 'POST' as const,
      path: '/api/families' as const,
      input: insertFamilySchema,
      responses: { 201: z.custom<typeof families.$inferSelect>(), 400: errorSchemas.validation }
    },
    get: {
      method: 'GET' as const,
      path: '/api/families/:id' as const,
      responses: { 200: z.custom<typeof families.$inferSelect>(), 404: errorSchemas.notFound }
    },
    getByCode: {
      method: 'GET' as const,
      path: '/api/families/code/:code' as const,
      responses: { 200: z.custom<typeof families.$inferSelect>(), 404: errorSchemas.notFound }
    },
    getUsers: {
      method: 'GET' as const,
      path: '/api/families/:id/users' as const,
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) }
    },
    getChores: {
      method: 'GET' as const,
      path: '/api/families/:id/chores' as const,
      responses: { 200: z.array(z.custom<typeof chores.$inferSelect>()) }
    },
    getLeaderboard: {
      method: 'GET' as const,
      path: '/api/families/:id/leaderboard' as const,
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) }
    },
    getInviteInfo: {
      method: 'GET' as const,
      path: '/api/families/:id/invite' as const,
      responses: { 200: z.object({ inviteCode: z.string(), inviteUrl: z.string() }), 403: errorSchemas.validation }
    }
  },
  users: {
    create: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: insertUserSchema,
      responses: { 201: z.custom<typeof users.$inferSelect>(), 400: errorSchemas.validation }
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id' as const,
      responses: { 200: z.custom<typeof users.$inferSelect>(), 404: errorSchemas.notFound }
    },
    updateAvatar: {
      method: 'PATCH' as const,
      path: '/api/users/:id/avatar' as const,
      input: z.object({ avatarConfig: z.string() }),
      responses: { 200: z.custom<typeof users.$inferSelect>(), 404: errorSchemas.notFound }
    },
    toggleLeaderboard: {
      method: 'PATCH' as const,
      path: '/api/users/:id/leaderboard' as const,
      input: z.object({ hideFromLeaderboard: z.boolean() }),
      responses: { 200: z.custom<typeof users.$inferSelect>(), 404: errorSchemas.notFound }
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/families/:id/messages' as const,
      responses: { 200: z.array(z.custom<typeof messages.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/messages' as const,
      input: z.object({
        familyId: z.coerce.number(),
        userId: z.coerce.number(),
        senderName: z.string(),
        content: z.string()
      }),
      responses: { 201: z.custom<typeof messages.$inferSelect>() }
    }
  },
  chores: {
    create: {
      method: 'POST' as const,
      path: '/api/chores' as const,
      input: insertChoreSchema,
      responses: { 201: z.custom<typeof chores.$inferSelect>(), 400: errorSchemas.validation }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/chores/:id' as const,
      input: insertChoreSchema.partial(),
      responses: { 200: z.custom<typeof chores.$inferSelect>(), 404: errorSchemas.notFound }
    },
    complete: {
      method: 'POST' as const,
      path: '/api/chores/:id/complete' as const,
      input: z.object({ userId: z.coerce.number() }),
      responses: { 200: z.object({ chore: z.custom<typeof chores.$inferSelect>(), user: z.custom<typeof users.$inferSelect>() }), 404: errorSchemas.notFound }
    }
  },
  rewards: {
    list: {
      method: 'GET' as const,
      path: '/api/families/:id/rewards' as const,
      responses: { 200: z.array(z.custom<typeof rewards.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/rewards' as const,
      input: insertRewardSchema,
      responses: { 201: z.custom<typeof rewards.$inferSelect>(), 400: errorSchemas.validation }
    },
    claim: {
      method: 'POST' as const,
      path: '/api/rewards/:id/claim' as const,
      input: z.object({ userId: z.coerce.number(), quantity: z.coerce.number().default(1) }),
      responses: { 200: z.object({ user: z.custom<typeof users.$inferSelect>() }), 400: errorSchemas.validation, 404: errorSchemas.notFound }
    }
  },
  demo: {
    setup: {
      method: 'POST' as const,
      path: '/api/demo/setup' as const,
      responses: { 201: z.custom<typeof families.$inferSelect>() }
    }
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
