import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// One admin password (ADMIN_PASSWORD in .env.local). Login sets a signed, httpOnly cookie that expires after 7 days.
export const COOKIE = "fayz_admin";
const WEEK = 7 * 24 * 3600;

const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
const sign = (exp: string) => createHmac("sha256", secret()).update(exp).digest("hex");
const sha = (s: string) => createHash("sha256").update(s).digest();

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD;

export function passwordOk(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && timingSafeEqual(sha(input), sha(pw));
}

export function makeToken() {
  const exp = String(Math.floor(Date.now() / 1000) + WEEK);
  return `${exp}.${sign(exp)}`;
}
export const COOKIE_MAX_AGE = WEEK;

export function tokenOk(token: string | undefined) {
  if (!token || !adminConfigured()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const want = Buffer.from(sign(exp)), got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

export function isAdmin(req: Request) {
  const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  return tokenOk(m?.[1]);
}
