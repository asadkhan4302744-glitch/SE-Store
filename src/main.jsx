import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import Admin from './Admin'
import Store from './Store'
import { Router, useRoute } from './router'

function App() {
  const { url } = useRoute()
  return url.pathname === '/admin' || url.pathname.startsWith('/admin/') ? (
    <Admin />
  ) : (
    <Store />
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
