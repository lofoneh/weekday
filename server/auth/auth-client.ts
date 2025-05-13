import { createAuthClient } from "better-auth/react";
const authClient = createAuthClient();

export const { listAccounts, signIn, signOut, useSession } = authClient;

export type Session = typeof authClient.$Infer.Session;
