"use client";

import * as React from "react";

import type { Session } from "@/server/auth";

import { RiCheckLine } from "@remixicon/react";
import Link from "next/link";

import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { NavUser } from "@/components/nav-user";
import SidebarCalendar from "@/components/sidebar-calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { api } from "@/trpc/react";

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session }) {
  const { isCalendarVisible, toggleCalendarVisibility } = useCalendarContext();
  const { data: calendars } = api.calendar.getCalendars.useQuery();

  return (
    <Sidebar
      variant="inset"
      {...props}
      className="dark scheme-only-dark max-lg:p-3 lg:pe-1"
    >
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <Link className="inline-flex" href="/">
            <span className="sr-only">Logo</span>
            <svg
              height="32"
              viewBox="0 0 32 32"
              width="32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m10.661.863-2.339 1.04 5.251 11.794L1.521 9.072l-.918 2.39 12.053 4.627-11.794 5.25 1.041 2.34 11.794-5.252L9.071 30.48l2.39.917 4.626-12.052 5.251 11.793 2.339-1.04-5.251-11.795 12.052 4.627.917-2.39-12.052-4.627 11.794-5.25-1.041-2.34-11.794 5.252L22.928 1.52l-2.39-.917-4.626 12.052L10.662.863Z"
                fill="#52525C"
              />
              <path
                d="M17.28 0h-2.56v12.91L5.591 3.78l-1.81 1.81 9.129 9.129H0v2.56h12.91L3.78 26.409l1.81 1.81 9.129-9.129V32h2.56V19.09l9.128 9.129 1.81-1.81-9.128-9.129H32v-2.56H19.09l9.129-9.129-1.81-1.81-9.129 9.129V0Z"
                fill="#F4F4F5"
              />
            </svg>
          </Link>
          <SidebarTrigger className="text-muted-foreground/80 hover:text-foreground/80 hover:bg-transparent!" />
        </div>
      </SidebarHeader>
      <SidebarContent className="mt-3 gap-0 border-t pt-3">
        <SidebarGroup className="px-1">
          <SidebarCalendar />
        </SidebarGroup>
        <SidebarGroup className="mt-3 border-t px-1 pt-4">
          <SidebarGroupLabel className="text-muted-foreground/65 uppercase">
            Calendars
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {calendars?.map((calendar, index) => {
                return (
                  <SidebarMenuItem key={calendar.id}>
                    <SidebarMenuButton
                      asChild
                      className="has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative justify-between rounded-md has-focus-visible:ring-[3px] [&>svg]:size-auto"
                    >
                      <span>
                        <span className="flex items-center justify-between gap-3 font-medium">
                          <Checkbox
                            id={calendar.id}
                            className="peer sr-only"
                            checked={isCalendarVisible(calendar.id)}
                            onCheckedChange={() =>
                              toggleCalendarVisibility(calendar.id)
                            }
                          />
                          <RiCheckLine
                            size={16}
                            className="peer-not-data-[state=checked]:invisible"
                            aria-hidden="true"
                          />
                          <label
                            className="peer-not-data-[state=checked]:text-muted-foreground/65 peer-not-data-[state=checked]:line-through after:absolute after:inset-0"
                            htmlFor={calendar.id}
                          >
                            {calendar.summary ?? ""}
                          </label>
                        </span>
                        <span
                          className="size-1.5 rounded-full"
                          style={{
                            backgroundColor: calendar.backgroundColor,
                          }}
                        ></span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
