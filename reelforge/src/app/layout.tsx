import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "ReelForge — AI repurposing & publishing for creators and businesses",
  description:
    "Turn one recording into a week of publish-ready short-form content. Auto clips, captions, and post copy for TikTok, Reels, and Shorts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
