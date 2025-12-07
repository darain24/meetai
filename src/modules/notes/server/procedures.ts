import { db } from "@/db";
import { notes } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { and, desc, eq, getTableColumns, ilike, or, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";

export const notesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        content: z.string(),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [createdNote] = await db
        .insert(notes)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      return createdNote;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
        pinned: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;

      const [updatedNote] = await db
        .update(notes)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(eq(notes.id, id), eq(notes.userId, ctx.auth.user.id)))
        .returning();

      if (!updatedNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      return updatedNote;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedNote] = await db
        .delete(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.auth.user.id)))
        .returning();

      if (!deletedNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      return deletedNote;
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          pinned: z.boolean().optional(),
          page: z.number().default(DEFAULT_PAGE),
          pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const conditions = [eq(notes.userId, ctx.auth.user.id)];

      if (input?.search) {
        conditions.push(
          or(
            ilike(notes.title, `%${input.search}%`),
            ilike(notes.content, `%${input.search}%`)
          )!
        );
      }

      if (input?.pinned !== undefined) {
        conditions.push(eq(notes.pinned, input.pinned));
      }

      const page = input?.page || DEFAULT_PAGE;
      const pageSize = input?.pageSize || DEFAULT_PAGE_SIZE;

      const userNotes = await db
        .select()
        .from(notes)
        .where(and(...conditions))
        .orderBy(desc(notes.updatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(notes)
        .where(and(...conditions));

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: userNotes,
        totalPages,
        total: total.count,
      };
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [note] = await db
        .select()
        .from(notes)
        .where(
          and(eq(notes.id, input.id), eq(notes.userId, ctx.auth.user.id))
        );

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      return note;
    }),

  togglePin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Get current note
      const [currentNote] = await db
        .select()
        .from(notes)
        .where(
          and(eq(notes.id, input.id), eq(notes.userId, ctx.auth.user.id))
        );

      if (!currentNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      // Toggle pinned status
      const [updatedNote] = await db
        .update(notes)
        .set({
          pinned: !currentNote.pinned,
          updatedAt: new Date(),
        })
        .where(eq(notes.id, input.id))
        .returning();

      return updatedNote;
    }),
});

