import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const { pathname } = req.nextUrl;

  const isLoginRoute = pathname === "/admin/login";
  const isProtectedRoute = pathname.startsWith("/pagos");
  const isRoot = pathname === "/"; // Detectamos la raíz

  // Si el usuario no está autenticado y trata de acceder a rutas protegidas
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pagos/:path*"], 
};
