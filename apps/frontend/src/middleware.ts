import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt } from 'jose';

// Rutas que no requieren autenticación
const PUBLIC_PATHS = ['/login', '/reservar'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si la ruta es pública o es un archivo estático, dejar pasar
  if (
    PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    // Si el usuario ya está logueado y trata de ir al login, redirigir al panel
    if (pathname === '/login') {
      const token = request.cookies.get('token')?.value;
      if (token) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Solo decodificamos el JWT para verificar expiración en el frontend.
    // La firma se verifica en el backend en cada petición.
    const claims = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      throw new Error('Token expirado');
    }
    return NextResponse.next();
  } catch (error) {
    // Token inválido o expirado
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
