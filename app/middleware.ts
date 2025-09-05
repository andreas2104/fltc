import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Récupérer le jeton de session à partir des cookies
  const token = request.cookies.get('token');

  const { pathname } = request.nextUrl;

  // Définir les chemins protégés (qui nécessitent une authentification)
  const protectedPaths = ['/dashboard', '/students', '/fees', '/pay', '/center'];

  // Définir les chemins publics (qui ne nécessitent pas d'authentification)
  const publicPaths = ['/login', '/registration'];

  // Vérifier si le chemin d'accès actuel est protégé
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // Vérifier si le chemin d'accès actuel est public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Cas 1 : Utilisateur non authentifié tentant d'accéder à une page protégée
  if (!token && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cas 2 : Utilisateur authentifié tentant d'accéder à une page publique
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si aucun cas de redirection n'est nécessaire, continuer normalement
  return NextResponse.next();
}

export const config = {
  // Exécuter le middleware sur toutes les routes sauf les fichiers statiques
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
