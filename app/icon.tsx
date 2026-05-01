import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

async function logoDataUri() {
  const logoPath = path.join(process.cwd(), "public", "branding", "paypulse-logo-transparent.png");
  const logoBuffer = await readFile(logoPath);
  return `data:image/png;base64,${logoBuffer.toString("base64")}`;
}

export default async function Icon() {
  const src = await logoDataUri();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          backgroundColor: "transparent",
        }}
      >
        {/* Keep original brand logo, only scaled for tab icon. */}
        <img src={src} alt="PayPulss" width={24} height={24} />
      </div>
    ),
    { ...size },
  );
}
