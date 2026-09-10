import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Figtree, Noto_Sans } from "next/font/google"
import { generateSEOMetadata } from "@/lib/seo/generateMetadata"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"]
})
const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  weight: ["400", "500", "700"]
})

export const metadata: Metadata = {
  ...generateSEOMetadata({
    title: "MaterniFlow — AI-Powered OB/GYN Scheduling Assistant",
    description: "An AI assistant for OB/GYN nurses. Query ward status, predict length-of-stay, coordinate rooms, receive alerts, and place orders through natural conversation.",
    keywords: ["Healthcare AI", "OB/GYN", "Scheduling", "Hospital", "AI Agent"],
  }),
  generator: 'v0.dev',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${figtree.variable} ${notoSans.variable}`}>
      <body className={`${notoSans.className} antialiased`}>{children}</body>
    </html>
  )
}
