'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

export function AtlasFooter() {
  return (
    <footer className="shrink-0 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">All Good</span>
            </div>
            <p className="hidden text-xs text-gray-500 sm:block">System operational</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
            <Link href="/status" className="text-gray-600 transition-colors hover:text-gray-900">
              Status
            </Link>
            <Link href="/terms" className="text-gray-600 transition-colors hover:text-gray-900">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-600 transition-colors hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/blog" className="text-gray-600 transition-colors hover:text-gray-900">
              Blog
            </Link>
            <Link href="/contact" className="text-gray-600 transition-colors hover:text-gray-900">
              Contact Sales
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} FlowForge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
