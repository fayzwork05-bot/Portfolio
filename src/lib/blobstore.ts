import "server-only";

// Vercel Blob is used when the project has a Blob store connected; otherwise everything stays on local disk (see store.ts).
export const blobOn = () =>
  !!(process.env.PORTFOLIO_STORE_ID || process.env.BLOB_STORE_ID || process.env.PORTFOLIO_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN);

/** Credentials for every Blob call: the store id (OIDC on Vercel) and/or a read-write token, whichever the project has. */
export const blobAuth = () => ({
  storeId: process.env.PORTFOLIO_STORE_ID || process.env.BLOB_STORE_ID || undefined,
  token: process.env.PORTFOLIO_READ_WRITE_TOKEN || undefined,
});
