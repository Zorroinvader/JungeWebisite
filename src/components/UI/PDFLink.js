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

