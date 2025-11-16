// FILE OVERVIEW
// - Purpose: Wrapper component for PDF links that opens PDFs in new tab with proper attributes; used for membership forms and documents.
// - Used by: Header, Footer, SideMenu, AboutPage, ContactPage for membership application PDF links.
// - Notes: Production component. Ensures PDFs open in new tabs with security attributes (noopener, noreferrer).

import React from 'react'

const PDFLink = ({ href, children, className, style, ...props }) => {
  const handleClick = (e) => {
    e.preventDefault()
    // Open PDF in new tab
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </a>
  )
}

export default PDFLink

