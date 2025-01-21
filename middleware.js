import { NextResponse } from "next/server";

export function middleware(req) {
    const response = NextResponse.next();

    // Cors settings

    response.headers.set("Access-Control-Allow-Origin", "*"); //Change this for my domain in productions
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return response;
}

//Configurar el middlware solo para las rutas de la API
export const config = {
    matcher: "/api/:path*",
}