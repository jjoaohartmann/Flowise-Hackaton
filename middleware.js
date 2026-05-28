import { NextResponse } from "next/server";

// Rotas que NÃO exigem autenticação (RN-01)
const PUBLIC_ROUTES = ["/login", "/signup"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Verifica se há token de sessão do Firebase (cookie)
  const session = request.cookies.get("__session")?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redireciona para login se não autenticado e rota protegida (RN-01)
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Evita que usuário logado acesse login/signup novamente
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
