import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { normalize } from "@/lib/content";
import { getContent, saveContent, withLock } from "@/lib/store";

export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "Not signed in." }, { status: 401 });
  return Response.json({ content: await getContent() });
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => null);
  return withLock(async () => {
    const r = normalize(body?.content, await getContent());
    if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
    await saveContent(r.content);
    revalidatePath("/");
    return Response.json({ content: r.content });
  });
}
