import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PayPulss — Suivi des impayés et relances pour freelances";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG 1200×630 : noir premium + accent indigo, lisible en partage. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0f172a",
          color: "#f8fafc",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            P
          </div>
          <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>PayPulss</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 920 }}>
          <div style={{ fontSize: 52, fontWeight: 650, lineHeight: 1.12, letterSpacing: "-0.03em" }}>
            Sachez qui vous doit quoi, et relancez en deux clics.
          </div>
          <div style={{ fontSize: 26, color: "#94a3b8", lineHeight: 1.35 }}>
            Suivi des impayés pour freelances et petites agences.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 20,
            color: "#cbd5e1",
          }}
        >
          <span style={{ color: "#f59e0b" }}>En attente</span>
          <span style={{ color: "#6366f1" }}>—</span>
          <span style={{ color: "#6366f1" }}>Relancé</span>
          <span style={{ color: "#6366f1" }}>—</span>
          <span style={{ color: "#10b981" }}>Payé</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
