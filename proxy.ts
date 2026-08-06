import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function getExpectedToken() {
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const enc = new TextEncoder();
  
  // Use Web Crypto API compatible with Next.js Edge Runtime
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(adminPass),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(adminUser));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /secure-panel routes
  if (pathname.startsWith('/secure-panel')) {
    const sessionCookie = request.cookies.get('admin_session');
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/secure-login', request.url));
    }

    const expectedToken = await getExpectedToken();
    if (sessionCookie.value !== expectedToken) {
      // Invalid session token, clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/secure-login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/secure-panel/:path*'],
};
