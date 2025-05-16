import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { auth } from "@/server/auth";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return <>{children}</>;
}
