import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import BigCalendar from "@/components/big-calendar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Weekday",
};

export default async function Page() {
  const session = await auth();

  console.log(session);

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
