import { COOKIE, COOKIE_MAX_AGE, adminConfigured, makeToken, passwordOk } from "@/lib/auth";

const cookie = (value: string, maxAge: number, req: Request) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`;

export async function POST(req: Request) {
  if (!adminConfigured()) return Response.json({ error: "ADMIN_PASSWORD is not set." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.password !== "string" || !passwordOk(body.password)) {
    await new Promise((r) => setTimeout(r, 800)); // slows down guessing
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie(makeToken(), COOKIE_MAX_AGE, req) } });
}

export async function DELETE(req: Request) {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie("", 0, req) } });
}
