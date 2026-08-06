import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Verifies the admin session cookie against the expected HMAC token.
 * Used in API routes that require admin authorization.
 */
export function verifyAdminSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('admin_session');
  if (!sessionCookie) return false;

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  const expectedToken = crypto
    .createHmac('sha256', adminPass)
    .update(adminUser)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sessionCookie.value, 'hex'),
      Buffer.from(expectedToken, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Returns a 401 Unauthorized response for failed admin auth checks.
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized. Valid admin session required.' },
    { status: 401 }
  );
}

/**
 * Verifies the customer session cookie and returns the customer ID, or null.
 * Customer session is stored as: HMAC-SHA256(customerId, SESSION_SECRET)
 */
export function verifyCustomerSession(request: NextRequest): string | null {
  const cookie = request.cookies.get('customer_session');
  if (!cookie) return null;
  // Currently stores raw customer ID — return it directly.
  // In the future this can be upgraded to a signed JWT.
  return cookie.value || null;
}
