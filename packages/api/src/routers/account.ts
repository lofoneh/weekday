import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { account, user } from "@weekday/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getCurrentUserAccount,
  fetchUserAccountCollection,
} from "../utils/accounts";

export const accountRouter = createTRPCRouter({
  fetchAll: protectedProcedure.query(async ({ ctx }) => {
    const userAccountData = await fetchUserAccountCollection(
      ctx.session.user,
      ctx.headers,
    );

    return {
      accounts: userAccountData,
    };
  }),

  updatePrimary: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const targetAccount = await ctx.db.query.account.findFirst({
        where: (table, { eq, and }) =>
          and(
            eq(table.id, input.accountId),
            eq(table.userId, ctx.session.user.id),
          ),
      });

      if (!targetAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      await ctx.db
        .update(user)
        .set({ defaultAccountId: input.accountId })
        .where(eq(user.id, ctx.session.user.id));
    }),

  retrievePrimary: protectedProcedure.query(async ({ ctx }) => {
    const primaryAccount = await getCurrentUserAccount(
      ctx.session.user,
      ctx.headers,
    );
    return { account: primaryAccount };
  }),

  remove: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const targetAccountId = input.accountId;

      await ctx.db
        .delete(account)
        .where(
          and(eq(account.id, targetAccountId), eq(account.userId, userId)),
        );

      const currentPrimaryAccount = await getCurrentUserAccount(
        ctx.session.user,
        ctx.headers,
      );

      if (currentPrimaryAccount.id === targetAccountId) {
        const remainingAccounts = await ctx.db.query.account.findMany({
          where: (table, { eq, and }) =>
            and(eq(table.userId, userId), ne(table.id, targetAccountId)),
          limit: 1,
        });

        const newPrimaryId =
          remainingAccounts.length > 0 ? remainingAccounts[0]!.id : null;

        await ctx.db
          .update(user)
          .set({ defaultAccountId: newPrimaryId })
          .where(eq(user.id, userId));
      }
    }),
});
