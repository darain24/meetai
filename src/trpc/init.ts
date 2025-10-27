import { auth } from '@/lib/auth';
import { initTRPC, TRPCError } from '@trpc/server';
import { headers } from 'next/headers';
import { cache } from 'react';
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: 'user_123' };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ctx, next}) => {
  let session;
  
  try {
      session = await auth.api.getSession({
          headers: await headers(),
      })
  } catch (error) {
      // Session token lookup failed (invalid/expired token)
      console.error('Session lookup failed:', error);
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session lookup failed'})
  }
  
  if (!session) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized'})
  }
  
  return next({ctx: {...ctx, auth: session}})
})