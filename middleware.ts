// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting (for production, use Redis)
const rateLimit = new Map();

const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

function getRateLimit(ip: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_DURATION;
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }
  
  const requests = rateLimit.get(ip).filter((time: number) => time > windowStart);
  rateLimit.set(ip, requests);
  
  return requests.length;
}

export function middleware(request: NextRequest) {
  // Get client IP
  const ip = request.ip ?? 
    request.headers.get('x-forwarded-for')?.split(',')[0] ?? 
    request.headers.get('x-real-ip') ?? 
    '127.0.0.1';

  // Apply rate limiting to API routes and auth endpoints
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/auth/')) {
    
    const requestCount = getRateLimit(ip);
    
    if (requestCount >= MAX_REQUESTS) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + 60).toString(),
        }
      });
    }

    // Add current request to rate limit tracker
    const requests = rateLimit.get(ip);
    requests.push(Date.now());
    rateLimit.set(ip, requests);

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
    response.headers.set('X-RateLimit-Remaining', (MAX_REQUESTS - requestCount - 1).toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + 60).toString());
    
    return response;
  }

  // Security headers for all requests
  const response = NextResponse.next();
  
  // Basic security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CSP for enhanced security
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; " +
    "frame-src 'none';"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};