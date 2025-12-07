import { db } from "@/db";
import { channels, channelMembers, messages, user } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { and, desc, eq, getTableColumns, ilike, or, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";

export const channelsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1, "Channel name is required") }))
    .mutation(async ({ input, ctx }) => {
      // Create channel
      const [createdChannel] = await db
        .insert(channels)
        .values({
          name: input.name,
        })
        .returning();

      // Add creator as member
      await db.insert(channelMembers).values({
        channelId: createdChannel.id,
        userId: ctx.auth.user.id,
      });

      return createdChannel;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get all channels where user is a member
      const userChannels = await db
        .select({
          ...getTableColumns(channels),
        })
        .from(channels)
        .innerJoin(channelMembers, eq(channels.id, channelMembers.channelId))
        .where(eq(channelMembers.userId, ctx.auth.user.id))
        .orderBy(desc(channels.createdAt));

      // If user has no channels, create a default "General" channel
      if (userChannels.length === 0) {
        // Check if "General" channel already exists
        const [generalChannel] = await db
          .select()
          .from(channels)
          .where(eq(channels.name, "General"))
          .limit(1);

        let channelToJoin;
        if (generalChannel) {
          channelToJoin = generalChannel;
        } else {
          // Create "General" channel
          const [newChannel] = await db
            .insert(channels)
            .values({
              name: "General",
            })
            .returning();
          channelToJoin = newChannel;
        }

        // Add user as member
        await db.insert(channelMembers).values({
          channelId: channelToJoin.id,
          userId: ctx.auth.user.id,
        });

        // Return the channel
        return [channelToJoin];
      }

      return userChannels;
    } catch (error) {
      // If tables don't exist, return empty array
      console.error("Error fetching channels:", error);
      return [];
    }
  }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, page, pageSize } = input;

      const conditions = [eq(channelMembers.userId, ctx.auth.user.id)];

      if (search) {
        conditions.push(ilike(channels.name, `%${search}%`));
      }

      const data = await db
        .select({
          ...getTableColumns(channels),
        })
        .from(channels)
        .innerJoin(channelMembers, eq(channels.id, channelMembers.channelId))
        .where(and(...conditions))
        .orderBy(desc(channels.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(channels)
        .innerJoin(channelMembers, eq(channels.id, channelMembers.channelId))
        .where(and(...conditions));

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        totalPages,
        total: total.count,
      };
    }),

  getMessages: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify user is a member of the channel
      const [membership] = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, input.channelId),
            eq(channelMembers.userId, ctx.auth.user.id)
          )
        );

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this channel",
        });
      }

      // Get messages with user info
      // Try to select with attachments, fallback if columns don't exist
      let channelMessages;
      try {
        channelMessages = await db
          .select({
            id: messages.id,
            content: messages.content,
            channelId: messages.channelId,
            userId: messages.userId,
            createdAt: messages.createdAt,
            updatedAt: messages.updatedAt,
            pinned: messages.pinned,
            attachments: messages.attachments,
            attachmentTypes: messages.attachmentTypes,
            user: {
              id: user.id,
              name: user.name,
              image: user.image,
              email: user.email,
            },
          })
          .from(messages)
          .innerJoin(user, eq(messages.userId, user.id))
          .where(eq(messages.channelId, input.channelId))
          .orderBy(messages.createdAt);
      } catch (error: unknown) {
        // If columns don't exist yet, query without them
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('attachments') || errorMessage.includes('attachment_types') || errorMessage.includes('does not exist')) {
          channelMessages = await db
            .select({
              id: messages.id,
              content: messages.content,
              channelId: messages.channelId,
              userId: messages.userId,
              createdAt: messages.createdAt,
              updatedAt: messages.updatedAt,
              pinned: messages.pinned,
              user: {
                id: user.id,
                name: user.name,
                image: user.image,
                email: user.email,
              },
            })
            .from(messages)
            .innerJoin(user, eq(messages.userId, user.id))
            .where(eq(messages.channelId, input.channelId))
            .orderBy(messages.createdAt);
        } else {
          throw error;
        }
      }

      return channelMessages
        .filter(msg => msg && msg.user) // Filter out any null/undefined messages
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          channelId: msg.channelId,
          userId: msg.userId,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          pinned: msg.pinned,
          attachments: 'attachments' in msg ? (msg.attachments as string[] | null) ?? null : null,
          attachmentTypes: 'attachmentTypes' in msg ? (msg.attachmentTypes as string[] | null) ?? null : null,
          user: msg.user,
        }));
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        content: z.string().default(""),
        attachments: z.array(z.string()).optional(), // Base64 encoded files
        attachmentTypes: z.array(z.enum(['image', 'file', 'voice'])).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is a member of the channel
      const [membership] = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, input.channelId),
            eq(channelMembers.userId, ctx.auth.user.id)
          )
        );

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this channel",
        });
      }

      // Validate that message has content or attachments
      const hasContent = input.content && input.content.trim().length > 0
      const hasAttachments = input.attachments && input.attachments.length > 0
      
      if (!hasContent && !hasAttachments) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Message must have content or attachments",
        });
      }

      // Create message (userId is required for new messages)
      if (!ctx.auth.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID is required",
        });
      }

      // Insert message - try with attachments, fallback if columns don't exist
      let createdMessage;
      try {
        [createdMessage] = await db
          .insert(messages)
          .values({
            channelId: input.channelId,
            userId: ctx.auth.user.id,
            content: input.content || "",
            attachments: input.attachments || [],
            attachmentTypes: input.attachmentTypes || [],
          })
          .returning();
      } catch (error: unknown) {
        // If columns don't exist, insert without attachments
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('attachments') || errorMessage.includes('attachment_types') || errorMessage.includes('does not exist')) {
          [createdMessage] = await db
            .insert(messages)
            .values({
              channelId: input.channelId,
              userId: ctx.auth.user.id,
              content: input.content || "",
            })
            .returning();
        } else {
          throw error;
        }
      }

      // Get message with user info
      // Try to select with attachments, fallback if columns don't exist
      let messageWithUser;
      try {
        [messageWithUser] = await db
          .select({
            id: messages.id,
            content: messages.content,
            channelId: messages.channelId,
            userId: messages.userId,
            createdAt: messages.createdAt,
            updatedAt: messages.updatedAt,
            pinned: messages.pinned,
            attachments: messages.attachments,
            attachmentTypes: messages.attachmentTypes,
            user: {
              id: user.id,
              name: user.name,
              image: user.image,
              email: user.email,
            },
          })
          .from(messages)
          .innerJoin(user, eq(messages.userId, user.id))
          .where(eq(messages.id, createdMessage.id));
      } catch (error: unknown) {
        // If columns don't exist yet, query without them
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('attachments') || errorMessage.includes('attachment_types') || errorMessage.includes('does not exist')) {
          [messageWithUser] = await db
            .select({
              id: messages.id,
              content: messages.content,
              channelId: messages.channelId,
              userId: messages.userId,
              createdAt: messages.createdAt,
              updatedAt: messages.updatedAt,
              pinned: messages.pinned,
              user: {
                id: user.id,
                name: user.name,
                image: user.image,
                email: user.email,
              },
            })
            .from(messages)
            .innerJoin(user, eq(messages.userId, user.id))
            .where(eq(messages.id, createdMessage.id));
        } else {
          throw error;
        }
      }

      if (!messageWithUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve created message",
        });
      }

      return {
        ...messageWithUser,
        attachments: 'attachments' in messageWithUser ? (messageWithUser.attachments as string[] | null) ?? null : null,
        attachmentTypes: 'attachmentTypes' in messageWithUser ? (messageWithUser.attachmentTypes as string[] | null) ?? null : null,
        user: messageWithUser.user,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Channel name is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is a member of the channel
      const [membership] = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, input.id),
            eq(channelMembers.userId, ctx.auth.user.id)
          )
        );

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this channel",
        });
      }

      // Update channel
      const [updatedChannel] = await db
        .update(channels)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(channels.id, input.id))
        .returning();

      if (!updatedChannel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      return updatedChannel;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify user is a member of the channel
      const [membership] = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, input.id),
            eq(channelMembers.userId, ctx.auth.user.id)
          )
        );

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this channel",
        });
      }

      // Delete channel (cascade will delete messages and members)
      const [deletedChannel] = await db
        .delete(channels)
        .where(eq(channels.id, input.id))
        .returning();

      if (!deletedChannel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      return deletedChannel;
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify requester is a member (basic permission check)
      const [requesterMembership] = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, input.channelId),
            eq(channelMembers.userId, ctx.auth.user.id)
          )
        );

      if (!requesterMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this channel",
        });
      }

      // Check if user is already a member
      const [existing] = await db
        .select()
        .from(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, input.channelId),
            eq(channelMembers.userId, input.userId)
          )
        );

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this channel",
        });
      }

      // Add member
      const [newMember] = await db
        .insert(channelMembers)
        .values({
          channelId: input.channelId,
          userId: input.userId,
        })
        .returning();

      return newMember;
    }),
});

