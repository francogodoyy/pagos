import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isLoginRoute = req.nextUrl.pathname === "/admin/login";
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/pagos");

  // Si intenta acceder a rutas protegidas sin token, redirigir al login
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Si ya tiene un token y está intentando acceder al login, redirigir a /pagos
  if (token && isLoginRoute) {
    return NextResponse.redirect(new URL("/pagos", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pagos/:path*"], // Asegúrate de que estas rutas están bien configuradas
};
