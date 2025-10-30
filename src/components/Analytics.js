import React from 'react'

const provider = process.env.REACT_APP_ANALYTICS_PROVIDER

function injectScript(attributes) {
  const script = document.createElement('script')
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent') {
      script.textContent = value
    } else if (value === true) {
      script.setAttribute(key, '')
    } else if (value !== false && value != null) {
      script.setAttribute(key, String(value))
    }
  })
  document.head.appendChild(script)
  return script
}

const Analytics = () => {
  React.useEffect(() => {
    const cleanupScripts = []

    if (provider === 'vercel') {
      const token = process.env.REACT_APP_VERCEL_ANALYTICS_TOKEN
      if (!token) return

      const script = injectScript({
        src: 'https://va.vercel-scripts.com/v1/script.js',
        defer: true,
        'data-token': token,
      })
      cleanupScripts.push(script)
    } else if (provider === 'plausible') {
      const domain = process.env.REACT_APP_PLAUSIBLE_DOMAIN
      if (!domain) return

      const script = injectScript({
        src: 'https://plausible.io/js/script.js',
        defer: true,
        'data-domain': domain,
      })
      cleanupScripts.push(script)
    } else if (provider === 'ga4') {
      const measurementId = process.env.REACT_APP_GA4_MEASUREMENT_ID
      if (!measurementId) return

      const loader = injectScript({
        src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
        async: true,
      })
      const init = injectScript({
        textContent: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);} 
          gtag('js', new Date());
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `,
      })
      cleanupScripts.push(loader, init)
    }

    return () => {
      cleanupScripts.forEach((el) => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el)
        }
      })
    }
  }, [])

  return null
}

export default Analytics


