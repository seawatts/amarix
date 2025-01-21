import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { AnalyticsProviders } from "@acme/analytics/providers";
import { cn } from "@acme/ui/lib/utils";
import { ThemeProvider } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import "@acme/ui/globals.css";

import { ClerkProvider } from "@clerk/nextjs";

import { env } from "~/env.server";
import { DebugStoreProvider } from "~/providers/debug-provider";
import { GameProvider } from "~/providers/game-provider";

export const metadata: Metadata = {
  description: "Amarix",
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://amarix.vercel.app"
      : "http://localhost:3000",
  ),
  openGraph: {
    description: "Amarix",
    siteName: "Amarix",
    title: "Amarix",
    url: "https://amarix.vercel.app",
  },
  title: "Amarix",
  twitter: {
    card: "summary_large_image",
    creator: "@seawatts",
    site: "@seawatts",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  // const cookieStore = await cookies();
  // const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "relative min-h-screen bg-background font-sans text-foreground antialiased",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <ClerkProvider>
          <AnalyticsProviders identifyUser>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <DebugStoreProvider>
                <GameProvider>
                  {/* <SidebarProvider defaultOpen={defaultOpen}> */}
                  <main className="flex-1">{props.children}</main>
                  {/* </SidebarProvider> */}
                </GameProvider>
              </DebugStoreProvider>
              <Toaster />
            </ThemeProvider>
          </AnalyticsProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
