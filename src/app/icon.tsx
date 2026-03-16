import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
        }}
      >
        <svg width={320} height={320} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#22d3ee" />
              <stop offset=".55" stopColor="#a78bfa" />
              <stop offset="1" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <circle
            cx="24"
            cy="24"
            r="18"
            fill="none"
            stroke="url(#g1)"
            strokeWidth="2.2"
            opacity=".95"
          />
          <path
            d="M14 25.5c3.5-6.5 6.5-6.5 10 0 2.2 4.2 4.6 4.2 7.8-0.5"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="34" cy="25" r="2.6" fill="url(#g1)" opacity=".95" />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
