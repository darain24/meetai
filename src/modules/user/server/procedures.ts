import { db } from "@/db";
import { user } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").optional(),
        image: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updateData: { name?: string; image?: string | null } = {};
      
      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      
      if (input.image !== undefined) {
        updateData.image = input.image || null;
      }

      const [updatedUser] = await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, ctx.auth.user.id))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return updatedUser;
    }),

  getOne: protectedProcedure.query(async ({ ctx }) => {
    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, ctx.auth.user.id))
      .limit(1);

    if (!currentUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return currentUser;
  }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    // Delete user (cascade will delete sessions, accounts, etc.)
    const [deletedUser] = await db
      .delete(user)
      .where(eq(user.id, ctx.auth.user.id))
      .returning();

    if (!deletedUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return { success: true };
  }),
});

