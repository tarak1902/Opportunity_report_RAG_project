import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");

  // Redirect unauthenticated users from protected routes
  if (!user && (isDashboardRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect full seats to waitlist on signup page
  if (request.nextUrl.pathname.startsWith("/signup")) {
    const { data: canSignup } = await supabase.rpc("can_signup");
    if (!canSignup) {
      const url = request.nextUrl.clone();
      url.pathname = "/waitlist";
      return NextResponse.redirect(url);
    }
  }

  // Subscription guard for dashboard.
  // /dashboard/settings is exempt so users can subscribe without hitting a redirect loop.
  // Admins bypass the check entirely.
  if (user && isDashboardRoute) {
    const isSettingsPage = request.nextUrl.pathname === "/dashboard/settings";

    if (!isSettingsPage) {
      const [subResult, profileResult] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .in("status", ["active", "grace_period"])
          .maybeSingle(),
        supabase
          .from("users_profile")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
      ]);

      const isAdmin =
        profileResult.data?.role === "admin" ||
        profileResult.data?.role === "ops_reviewer";

      if (!subResult.data && !isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/settings";
        url.searchParams.set("setup", "1");
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
