import { head, list, put, del } from "@vercel/blob";
import { isAdmin } from "@/lib/auth";
import { blobAuth, blobOn } from "@/lib/blobstore";

export const dynamic = "force-dynamic";

/** GET /api/admin/diag (signed in): walks through a write, a read-back and a delete on the Blob store and reports each step. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "Not signed in." }, { status: 401 });
  const out: Record<string, unknown> = {
    blobOn: blobOn(),
    env: Object.fromEntries(["PORTFOLIO_STORE_ID", "BLOB_STORE_ID", "PORTFOLIO_READ_WRITE_TOKEN", "BLOB_READ_WRITE_TOKEN", "VERCEL_OIDC_TOKEN"].map((k) => [k, !!process.env[k]])),
    vercel: !!process.env.VERCEL,
  };
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      out[name] = await fn();
    } catch (e) {
      out[name] = "ERROR: " + (e as Error).name + ": " + (e as Error).message;
    }
  };
  const stamp = String(Date.now());
  await step("1_write_test_file", async () => (await put("diag.txt", stamp, { access: "public", allowOverwrite: true, addRandomSuffix: false, contentType: "text/plain", cacheControlMaxAge: 60, ...blobAuth() })).url);
  await step("2_read_back_test_file", async () => {
    const h = await head("diag.txt", blobAuth());
    const txt = await (await fetch(`${h.url}?t=${Date.now()}`, { cache: "no-store" })).text();
    return { url: h.url, matchesWhatWasWritten: txt === stamp };
  });
  await step("3_content_json", async () => {
    const h = await head("content.json", blobAuth());
    const txt = await (await fetch(`${h.url}?t=${Date.now()}`, { cache: "no-store" })).text();
    return { url: h.url, bytes: h.size, uploadedAt: h.uploadedAt, hasAbout: txt.includes('"about"'), firstSectionMarquee: /"marquee":\s*"([^"]*)"/.exec(txt)?.[1] ?? null };
  });
  await step("4_list_all_blobs", async () => (await list({ ...blobAuth() })).blobs.map((b) => `${b.pathname} (${b.size} bytes)`));
  await step("5_delete_test_file", async () => {
    await del("diag.txt", blobAuth());
    return "ok";
  });
  return Response.json(out, { headers: { "Cache-Control": "no-store" } });
}
