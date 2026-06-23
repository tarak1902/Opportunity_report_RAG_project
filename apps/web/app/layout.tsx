import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Startup Opportunity Report Engine",
  description: "RAG-based startup opportunity reports from indexed article data"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
