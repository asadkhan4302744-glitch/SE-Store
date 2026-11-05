import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

const RouteContext = createContext(null)

export function Router({ children }) {
  const [url, setUrl] = useState(() => new URL(window.location.href))
  const navigate = useCallback((href, { replace = false } = {}) => {
    const next = new URL(href, window.location.origin)
    if (next.origin !== window.location.origin) {
      window.location.assign(next.href)
      return
    }
    window.history[replace ? 'replaceState' : 'pushState'](
      {},
      '',
      next.pathname + next.search + next.hash,
    )
    setUrl(next)
  }, [])
  useEffect(() => {
    const pop = () => setUrl(new URL(window.location.href))
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  useEffect(() => {
    if (url.hash)
      requestAnimationFrame(() => {
        const target = document.getElementById(url.hash.slice(1))
        if (target?.tagName === 'DETAILS') target.open = true
        target?.scrollIntoView()
      })
    else window.scrollTo({ top: 0, behavior: 'instant' })
    document.querySelector('#store-main')?.focus({ preventScroll: true })
  }, [url.pathname, url.hash])
  return (
    <RouteContext.Provider value={{ url, navigate }}>
      {children}
    </RouteContext.Provider>
  )
}

export const useRoute = () => useContext(RouteContext)

export function Link({ href, onClick, children, ...props }) {
  const { navigate } = useRoute()
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target ||
          props.download !== undefined
        )
          return
        if (
          new URL(href, window.location.origin).origin !==
          window.location.origin
        )
          return
        event.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}
