import {getToken} from 'next-auth/jwt';

import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    //If not any token, return to the login
    if (!token) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    //verify if the user is the admin
    if (token.user.role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    //if the user is the admin, allow the access
    return NextResponse.next();
}

//apply this middleware just to the routes what i want to protect
export const config = {
    matcher: ["/pagos/:path*", "/admin/:path*"],
}
