import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/chat", "/seller", "/wardrobe"];
const PROTECTED_EXACT_PATHS = new Set([
  "/profile",
  "/profile/settings",
  "/sustainability",
]);

function isProtectedPath(pathname: string): boolean {
  if (PROTECTED_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (refreshToken) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/auth/sign-in", request.url);
  signInUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/seller/:path*",
    "/wardrobe/:path*",
    "/profile",
    "/profile/settings",
    "/sustainability",
  ],
};
