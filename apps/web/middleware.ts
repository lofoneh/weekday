import { betterFetch } from "@better-fetch/fetch";
import { type Session } from "@weekday/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  console.log(session);

  const authRoutes = ["/login", "/signup"];
  if (authRoutes.includes(pathname) && session) {
    console.log("Redirecting to calendar");

    return NextResponse.redirect(new URL("/calendar", request.url));
  }

  if (pathname.startsWith("/calendar") && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/calendar/:path*", "/login", "/signup"],
  runtime: "nodejs",
};
