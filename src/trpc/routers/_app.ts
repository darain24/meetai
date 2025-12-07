import { z } from 'zod';
import { createTRPCRouter } from '../init';
import { channelsRouter } from '@/modules/channels/server/procedures';
import { notesRouter } from '@/modules/notes/server/procedures';
import { userRouter } from '@/modules/user/server/procedures';
import { contactRouter } from '@/modules/contact/server/procedures';
// Legacy routers (to be removed after migration)
import { agentsRouter } from '@/modules/agents/server/procedures';
import { meetingsRouter } from '@/modules/meetings/server/procedures';

export const appRouter = createTRPCRouter({
  channels: channelsRouter,
  notes: notesRouter,
  user: userRouter,
  contact: contactRouter,
  // Legacy routers (to be removed)
  agents: agentsRouter,
  meetings: meetingsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;