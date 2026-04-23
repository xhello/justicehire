import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const fd = await request.formData();
  const update = {
    display_name: String(fd.get("display_name") ?? ""),
    city: String(fd.get("city") ?? ""),
    tagline: String(fd.get("tagline") ?? ""),
    bio: String(fd.get("bio") ?? ""),
    role: "host" as const,
    host_status: "waitlist" as const,
  };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
