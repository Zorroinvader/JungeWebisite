// FILE OVERVIEW
// - Purpose: React entry point that mounts the App component into the DOM.
// - Used by: Webpack/CRA build as the single-page app bootstrap file.
// - Notes: Production entry file. Usually no app logic should live here.

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
