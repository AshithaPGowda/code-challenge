import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*'); // or your domain
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

// Apply only to API routes
export const config = {
  matcher: '/api/:path*',
};
