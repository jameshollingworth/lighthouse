import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Last Light · A tiny adventure",
  description: "A small lighthouse. An endless sea. Somewhere, a light still burns.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body data-theme="rocks">{children}</body>
    </html>
  );
}
