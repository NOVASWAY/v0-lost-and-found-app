import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { NavigationWrapper } from "@/components/navigation-wrapper"

const inter = Inter({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vault Church Security System",
    template: "%s | Vault Church",
  },
  description:
    "Vault Church Security System - community lost & found management, asset tracking, security playbooks, and audit logging. Shielded in silence. Fortified for eternity.",
  applicationName: "Vault Church Security System",
  keywords: [
    "church security",
    "lost and found",
    "asset tracking",
    "security playbooks",
    "vault church",
    "claim processing",
  ],
  authors: [{ name: "Vault Church" }],
  creator: "Vault Church",
  publisher: "Vault Church",
  icons: {
    icon: "/vault-church-logo.jpeg",
    apple: "/vault-church-logo.jpeg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Vault Church Security System",
    title: "Vault Church Security System",
    description:
      "Community lost & found management, asset tracking, security playbooks, and audit logging.",
    images: [{ url: "/vault-church-logo.jpeg", width: 512, height: 512, alt: "Vault Church" }],
  },
  twitter: {
    card: "summary",
    title: "Vault Church Security System",
    description:
      "Community lost & found management, asset tracking, security playbooks, and audit logging.",
    images: ["/vault-church-logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Vault Church Security System",
              url: siteUrl,
              description:
                "Community lost & found management, asset tracking, security playbooks, and audit logging.",
              publisher: {
                "@type": "Organization",
                name: "Vault Church",
                logo: `${siteUrl}/vault-church-logo.jpeg`,
              },
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <NavigationWrapper>
              {children}
            </NavigationWrapper>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
