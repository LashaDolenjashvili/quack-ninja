import { ImageResponse } from "next/og";

export const size = {
  width: 256,
  height: 256,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#003C79",
          borderRadius: "56px",
        }}
      >
        <div
          style={{
            width: "140px",
            height: "140px",
            background: "#09CEA4",
            borderRadius: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#003C79",
            fontSize: "64px",
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          FS
        </div>
      </div>
    ),
    size
  );
}
