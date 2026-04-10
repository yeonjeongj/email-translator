import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "메일 번역",
  description: "AI-powered email translation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
