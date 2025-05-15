import type { Metadata } from "next";

import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { ResizablePanelsClient } from "@/components/resizable-panels-client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Weekday",
};

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const today = new Date();
  const timeMin = startOfMonth(subMonths(today, 3)).toISOString();
  const timeMax = endOfMonth(addMonths(today, 3)).toISOString();

  api.calendar.getEvents.prefetch({ timeMax, timeMin });

  return (
    <HydrateClient>
      <SidebarProvider>
        <AppSidebar session={session} />
        <SidebarInset className="flex-1 bg-transparent">
          <ResizablePanelsClient />
        </SidebarInset>
      </SidebarProvider>
    </HydrateClient>
  );
}
