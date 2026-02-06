import { ImageResponse } from "next/og";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export async function GET() {
  const [wordmarkBuffer, markSvg] = await Promise.all([
    fetch(
      new URL(
        "../../../public/brand/quackninja-wordmark-white.png",
        import.meta.url
      )
    ).then((res) => res.arrayBuffer()),
    fetch(
      new URL("../../../public/brand/quackninja-mark.svg", import.meta.url)
    ).then((res) => res.text()),
  ]);

  const wordmarkBase64 = arrayBufferToBase64(wordmarkBuffer);
  const wordmarkUrl = `data:image/png;base64,${wordmarkBase64}`;
  const markUrl = `data:image/svg+xml;utf8,${encodeURIComponent(markSvg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "64px",
          background:
            "linear-gradient(135deg, #003C79 0%, #00356B 45%, #001F40 100%)",
          color: "#ffffff",
          position: "relative",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-120px auto auto -160px",
            width: "420px",
            height: "420px",
            borderRadius: "999px",
            background:
              "radial-gradient(circle, rgba(9,206,164,0.35), rgba(9,206,164,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-120px",
            bottom: "-160px",
            width: "520px",
            height: "520px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.08)",
            filter: "blur(30px)",
          }}
        />

        <div style={{ display: "flex", gap: "48px", alignItems: "center" }}>
          <div
            style={{
              width: "300px",
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.35))",
            }}
          >
            <img src={markUrl} width={300} height={300} alt="QuackNinja mark" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img
                src={wordmarkUrl}
                width={260}
                height={48}
                alt="QuackNinja"
              />
            </div>
            <div style={{ fontSize: "64px", fontWeight: 700, lineHeight: 1.05 }}>
              SQL on CSV / Excel / Parquet
            </div>
            <div
              style={{
                fontSize: "28px",
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.78)",
                maxWidth: "640px",
              }}
            >
              Local-first. Powered by DuckDB. Export clean results in minutes.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}
