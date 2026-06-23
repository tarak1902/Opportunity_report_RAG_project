import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdminOrReviewer() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, reason: "unauthorized" };
  }

  const { data } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = data?.role;
  if (role !== "admin" && role !== "ops_reviewer") {
    return { ok: false as const, reason: "forbidden" };
  }

  return { ok: true as const, userId: user.id };
}
