import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { NavigationWrapper } from "@/components/navigation-wrapper"
import { BackgroundMusic } from "@/components/background-music"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vault Church Lost & Found",
  description: "Vault Church Community Lost & Found Management System - Shielded in Silence. Fortified for Eternity.",
  generator: "v0.app",
  icons: {
    icon: "/vault-church-logo.jpeg",
    apple: "/vault-church-logo.jpeg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <NavigationWrapper>
              {children}
            </NavigationWrapper>
            <BackgroundMusic />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
