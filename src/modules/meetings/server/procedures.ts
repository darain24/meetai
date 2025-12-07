import { db } from "@/db";
// Legacy imports - these tables are being removed
// import { agents, meetings, messages } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
import z from "zod";
import { and, desc, eq, getTableColumns, ilike, count, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";
import { MeetingStatus } from "../types";
import { generateAvatarUri } from "@/lib/avatar";
// AI functionality removed - this router is legacy

export const meetingsRouter = createTRPCRouter({
  generateToken: protectedProcedure
    .input(z.object({ meetingId: z.string().optional() }).optional())
    .mutation(async ({ctx, input}) => {
      // For Daily.co, we need a room name to generate a token
      // If meetingId is provided, use it as room name, otherwise generate one
      const roomName = input?.meetingId || `room-${ctx.auth.user.id}-${Date.now()}`
      
      // Ensure the room exists
      let room = await dailyVideo.getRoom(roomName)
      if (!room) {
        room = await dailyVideo.createRoom(roomName, {
          privacy: "private",
          properties: {
            enable_transcription: true,
            // enable_recording is configured at account level in Daily.co dashboard
          },
        })
      }

      // Generate a token for the user
      const token = await dailyVideo.createMeetingToken(roomName, ctx.auth.user.id, {
        exp: Math.floor(Date.now() / 1000) + 3600,
        is_owner: true,
        user_name: ctx.auth.user.name,
        user_id: ctx.auth.user.id,
      })

      return { token, roomUrl: room.url || `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN || 'your-domain'}.daily.co/${roomName}` }
    }),
  generateAgentToken: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ctx, input}) => {
      // Get the meeting to find the agent
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.id, input.meetingId),
            eq(meetings.userId, ctx.auth.user.id)
          )
        )

      if (!existingMeeting) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Meeting not found'})
      }

      if (!existingMeeting.agent) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Agent not found'})
      }

      const roomName = input.meetingId
      
      // Ensure the room exists
      let room = await dailyVideo.getRoom(roomName)
      if (!room) {
        room = await dailyVideo.createRoom(roomName, {
          privacy: "private",
          properties: {
            enable_transcription: true,
          },
        })
      }

      // Generate a token for the agent
      const token = await dailyVideo.createMeetingToken(roomName, existingMeeting.agent.id, {
        exp: Math.floor(Date.now() / 1000) + 3600,
        is_owner: false,
        user_name: existingMeeting.agent.name,
        user_id: existingMeeting.agent.id,
      })

      return { 
        token, 
        roomUrl: room.url || `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN || 'your-domain'}.daily.co/${roomName}`,
        agentId: existingMeeting.agent.id,
        agentName: existingMeeting.agent.name,
      }
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedMeeting] = await db
        .delete(meetings)
        .where(and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)))
        .returning();

      if (!removedMeeting) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Agent not found'})
      }

      return removedMeeting;
    }),
  update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedMeeting] = await db
        .update(meetings)
        .set(input)
        .where(and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)))
        .returning();

      if (!updatedMeeting) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Agent not found'})
      }

      return updatedMeeting;
    }),
  start: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id),
            eq(meetings.status, MeetingStatus.Upcoming)
          )
        );

      if (!existingMeeting) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Meeting not found or already started'})
      }

      const [startedMeeting] = await db
        .update(meetings)
        .set({
          status: MeetingStatus.Active,
          startedAt: new Date(),
        })
        .where(and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)))
        .returning();

      if (!startedMeeting) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Meeting not found'})
      }

      return startedMeeting;
    }),
  create: protectedProcedure
  .input(meetingsInsertSchema)
  .mutation(async ({ input, ctx }) => {
    const [createdmeeting] = await db
      .insert(meetings)
      .values({
        ...input,
        userId: ctx.auth.user.id,
      })
      .returning();
    // Create Daily.co room for the meeting
    const roomName = createdmeeting.id
    const room = await dailyVideo.createRoom(roomName, {
      privacy: "private",
      properties: {
        enable_transcription: true,
        // enable_recording is configured at account level in Daily.co dashboard
        custom: {
          meetingId: createdmeeting.id,
          meetingName: createdmeeting.name,
        },
      },
    })

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, createdmeeting.agentId))

    if(!existingAgent) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Agent not found'
      })
    }

    // Daily.co doesn't require user creation like Stream - users are identified by tokens

    return createdmeeting;
  }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as("duration")
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.auth.user.id)
          )
        );

        if (!existingMeeting) {
          throw new TRPCError({code: 'NOT_FOUND', message: 'Meeting not found'})
        }

      return existingMeeting;
    }),
   getMany: protectedProcedure
     .input(
       z.object({
         page: z.number().default(DEFAULT_PAGE),
         pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
         search: z.string().nullish(),
         agentId: z.string().nullish(),
         status: z.enum([
          MeetingStatus.Upcoming,
          MeetingStatus.Active,
          MeetingStatus.Completed,
          MeetingStatus.Cancelled,
          MeetingStatus.Processing,
         ]).nullish(),
       })
     )
     .query(async ({input, ctx}) => {
       const {search, page, pageSize, status, agentId} = input;

       const data = await db
         .select({
           ...getTableColumns(meetings),
           agent: agents,
           duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as("duration")
         })
         .from(meetings)
         .innerJoin(agents, eq(meetings.agentId, agents.id))
         .where(
             and(
                 eq(meetings.userId, ctx.auth.user.id),
                 search ? ilike(meetings.name, `%${search}%`) : undefined,
                 status ? eq(meetings.status, status) : undefined,
             )
         )
         .orderBy(desc(meetings.createdAt), desc(meetings.id))
         .limit(pageSize)
         .offset((page - 1) * pageSize);

         const [total] = await db
         .select({count : count()})
         .from(meetings)
         .innerJoin(agents, eq(meetings.agentId, agents.id))
         .where(
             and(
                 eq(meetings.userId, ctx.auth.user.id),
                 search ? ilike(meetings.name, `%${search}%`) : undefined,
                 status ? eq(meetings.status, status) : undefined,
                 agentId ? eq(meetings.agentId, agentId) : undefined,
             )
         )
         const totalPages = Math.ceil(total.count / pageSize);

         return {
            items: data,
            totalPages,
            total: total.count,
         }
     }),
  getMessages: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify meeting belongs to user
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.meetingId),
            eq(meetings.userId, ctx.auth.user.id)
          )
        );

      if (!existingMeeting) {
        throw new TRPCError({code: 'NOT_FOUND', message: 'Meeting not found'})
      }

      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.meetingId, input.meetingId))
        .orderBy(messages.createdAt);

      return chatMessages;
    }),
  sendMessage: protectedProcedure
    .input(z.object({ 
      meetingId: z.string(),
      content: z.string().min(1, { message: 'Message cannot be empty' })
    }))
    .mutation(async ({ input, ctx }) => {
      // Legacy endpoint - AI functionality removed
      // This endpoint is deprecated. Use channels.sendMessage instead.
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'This endpoint is deprecated. Please use channels.sendMessage instead.',
      });
    }),
});
