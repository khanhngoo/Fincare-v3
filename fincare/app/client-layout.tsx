"use client"

import type React from "react"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { Navbar } from "@/components/common/navbar"
import { Footer } from "@/components/common/footer"
import { Toaster } from "sonner"

export function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  const showNavbar = pathname === "/" || pathname === "/loan-form"
  const showFooter = pathname === "/" || pathname === "/loan-form"

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        {showNavbar && <Navbar />}
        <main className="flex-1">{children}</main>
        {showFooter && <Footer />}
      </Suspense>
      <Analytics />
      <Toaster position="top-right" richColors />
    </>
  )
}
