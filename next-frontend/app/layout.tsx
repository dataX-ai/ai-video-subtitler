import type { Metadata } from 'next'
import './globals.css'
import { PostHogProvider } from './providers'
import { HighlightInit } from '@highlight-run/next/client'



export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <HighlightInit
        projectId= {process.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID}
        excludedHostnames={['localhost']}
        serviceName="subtitle-nextjs-frontend"
        tracingOrigins
        networkRecording={{
          enabled: true,
          recordHeadersAndBody: true,
          urlBlocklist: [],
        }}
        debug
      />
      <html lang="en">
        <body>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </body>
      </html>
    </>
  )
}
