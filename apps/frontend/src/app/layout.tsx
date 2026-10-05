import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CORVIZ | Verified Visual Learning",
  description: "Learn computer science through verified deterministic algorithm visualizations, step-by-step playback, narration, and an explain-only AI Tutor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
