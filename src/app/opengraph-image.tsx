import { ImageResponse } from "next/og";
import { site } from "@/data/site";

export const alt = `${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#e4e4e4", padding: 64, color: "#0c0c0c" }}>
        <div style={{ fontSize: 32, letterSpacing: 4 }}>{site.role.toUpperCase()}</div>
        <div style={{ fontSize: 190, fontWeight: 900, lineHeight: 0.9 }}>{site.name.toUpperCase()}</div>
        <div style={{ display: "flex", background: "#d32a1f", height: 24, width: 240 }} />
      </div>
    ),
    size,
  );
}
