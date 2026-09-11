import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
export async function GET(request: NextRequest) {
  const origin = process.env.APP_ORIGIN;
  if (!origin) return new NextResponse("Authentication is not configured.", { status: 503 });
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") === "/update-password" ? "/update-password" : "/account";
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } catch { /* Return a safe error without leaking tokens or provider details. */ }
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", origin));
}


