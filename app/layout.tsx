import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JKTL Command Centre",
  description: "JK Technology Limited internal platform dashboard",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
