import { HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experiment 06 - Crafted.is",
};

import { AppSidebar } from "@/components/app-sidebar";
import BigCalendar from "@/components/big-calendar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <SidebarProvider>
        <AppSidebar session={session} />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
            <BigCalendar />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </HydrateClient>
  );
}
