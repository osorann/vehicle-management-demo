import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE } from "@/lib/auth/demo-session";
import { decideRoute } from "@/lib/auth/guard";
import { appConfig } from "@/lib/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const hasDemoCookie = request.cookies.get(DEMO_COOKIE_NAME)?.value === DEMO_COOKIE_VALUE;

  let hasProductionUser = false;
  // デモセッション中は Supabase に一切問い合わせない
  if (appConfig.supabaseConfigured && !(hasDemoCookie && appConfig.demoEnabled)) {
    const supabase = createServerClient(appConfig.supabaseUrl, appConfig.supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    hasProductionUser = Boolean(data?.claims?.sub);
  }

  const decision = decideRoute({
    pathname: request.nextUrl.pathname,
    demoEnabled: appConfig.demoEnabled,
    hasDemoCookie,
    hasProductionUser,
  });

  if (decision.action === "allow") return response;

  const redirect = NextResponse.redirect(new URL(decision.to, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  if (decision.clearDemoCookie) redirect.cookies.delete(DEMO_COOKIE_NAME);
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
