import { Monitoring } from "react-scan/monitoring/next";

import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";

import { CalendarProvider } from "@/components/event-calendar/calendar-context";
import { Toaster } from "@/components/ui/sonner";
import { ChatProvider } from "@/providers/chat-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TRPCReactProvider } from "@/trpc/react";

import "./globals.css";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chatCookie = (await cookies()).get("chat:state")?.value;
  const chatDefaultOpen = chatCookie === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://unpkg.com/react-scan/dist/install-hook.global.js"
          strategy="beforeInteractive"
        />
        <Script src="https://unpkg.com/react-scan/dist/auto.global.js" />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} bg-sidebar font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <ChatProvider defaultOpen={chatDefaultOpen}>
            <TRPCReactProvider>
              <CalendarProvider>
                <Monitoring
                  apiKey="aAtMeM4KutsWRfQmLmZ-COHAsOuPvThS"
                  branch={process.env.GIT_BRANCH}
                  commit={process.env.GIT_COMMIT_HASH}
                  url="https://monitoring.react-scan.com/api/v1/ingest"
                />
                {children}
              </CalendarProvider>
              <Toaster />
            </TRPCReactProvider>
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
