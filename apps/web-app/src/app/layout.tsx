import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { AnalyticsProviders } from '@acme/analytics/providers'
import { cn } from '@acme/ui/lib/utils'
import { ThemeProvider } from '@acme/ui/theme'
import { Toaster } from '@acme/ui/toast'

import '@acme/ui/globals.css'

import { ClerkProvider } from '@clerk/nextjs'

import { TRPCReactProvider } from '@acme/api/client'
import { PresenceStoreProvider } from '@acme/db/supabase/client'
import { env } from '~/env.server'

export const metadata: Metadata = {
  description: 'Amarix',
  metadataBase: new URL(
    env.VERCEL_ENV === 'production'
      ? 'https://amarix.vercel.app'
      : 'http://localhost:3000',
  ),
  openGraph: {
    description: 'Amarix',
    siteName: 'Amarix',
    title: 'Amarix',
    url: 'https://amarix.vercel.app',
  },
  title: 'Amarix',
  twitter: {
    card: 'summary_large_image',
    creator: '@seawatts',
    site: '@seawatts',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { color: 'white', media: '(prefers-color-scheme: light)' },
    { color: 'black', media: '(prefers-color-scheme: dark)' },
  ],
}

export default function RootLayout(props: { children: React.ReactNode }) {
  // const cookieStore = await cookies();
  // const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'bg-background text-foreground relative min-h-screen font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <NuqsAdapter>
          <TRPCReactProvider>
            <ClerkProvider>
              <PresenceStoreProvider>
                <AnalyticsProviders identifyUser>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                  >
                    {/* <SidebarProvider defaultOpen={defaultOpen}> */}
                    <main className="flex-1">{props.children}</main>
                    {/* </SidebarProvider> */}
                    <Toaster />
                  </ThemeProvider>
                </AnalyticsProviders>
              </PresenceStoreProvider>
            </ClerkProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
