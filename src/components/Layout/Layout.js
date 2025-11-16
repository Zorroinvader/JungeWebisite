// FILE OVERVIEW
// - Purpose: Main layout wrapper component that provides Header and Footer around page content; used for consistent page structure.
// - Used by: All public pages via App.js routes (HomePage, AboutPage, FAQPage, ContactPage, etc.) wrapped in <Layout>.
// - Notes: Production component. Provides consistent navigation and footer across all pages; children are the page content.

import React from 'react'
import Header from './Header'
import Footer from './Footer'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F4F1E8] dark:bg-[#252422]">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
