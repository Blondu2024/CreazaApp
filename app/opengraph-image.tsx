import { ImageResponse } from "next/og";

export const alt = "CreazaApp — Creează aplicații web cu AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            CA
          </div>
          <div style={{ display: "flex", fontSize: "48px", fontWeight: 700 }}>
            <span style={{ color: "#a78bfa" }}>Creaza</span>
            <span style={{ color: "#ffffff" }}>App</span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: "56px",
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "20px",
          }}
        >
          Construieste aplicatii web cu AI
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Descrie ce vrei in romana - AI-ul scrie codul - Preview instant
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "48px",
            padding: "20px 40px",
            background: "rgba(99, 102, 241, 0.1)",
            borderRadius: "16px",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 700, color: "#a78bfa" }}>14+</span>
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>Modele AI</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 700, color: "#a78bfa" }}>8</span>
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>API-uri AI</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 700, color: "#a78bfa" }}>100%</span>
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>In romana</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
