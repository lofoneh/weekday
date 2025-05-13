import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { ResizablePanelsClient } from "@/components/resizable-panels-client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Weekday",
};

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

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
