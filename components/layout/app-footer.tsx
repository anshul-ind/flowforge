'use client'

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-6 md:pl-80 mt-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-600">
          © {currentYear} FlowForge. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
            Privacy
          </a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
            Terms
          </a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
            Support
          </a>
        </div>
      </div>
    </footer>
  )
}
