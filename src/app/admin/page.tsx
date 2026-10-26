import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE, adminConfigured, tokenOk } from "@/lib/auth";
import { getContent } from "@/lib/store";
import { AdminLogin, AdminPanel } from "@/components/AdminPanel";
import { blobOn } from "@/lib/blobstore";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminConfigured())
    return (
      <main className="adm adm-narrow">
        <h1>Admin is not set up</h1>
        <p>
          Add <code>ADMIN_PASSWORD=your-password</code> to <code>.env.local</code> and restart the site.
        </p>
      </main>
    );
  const signedIn = tokenOk((await cookies()).get(COOKIE)?.value);
  return signedIn ? <AdminPanel initial={await getContent()} blob={blobOn()} /> : <AdminLogin />;
}
