import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function proxy(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const { pathname } = req.nextUrl;

  const isLoginRoute = pathname === "/admin/login";
  const isRegisterRoute = pathname === "/admin/register";
  const isProtectedRoute =
    pathname.startsWith("/pagos") ||
    pathname.startsWith("/nuevo-pago") ||
    pathname.startsWith("/dashboard") ||
    (pathname.startsWith("/admin/") && !isLoginRoute && !isRegisterRoute);

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pagos/:path*", "/nuevo-pago", "/dashboard"],
};
