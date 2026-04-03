'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

export function AtlasFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Status Section */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">All Good</span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">System operational</p>
          </div>

          {/* Links Section */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/status"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Status
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/blog"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contact Sales
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} FlowForge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
