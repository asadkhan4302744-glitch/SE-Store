import React, { useEffect, useRef, useState } from 'react'
import { X, Zap } from 'lucide-react'

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Shahzad Electronics home">
      <img src="/images/shahzad-se-logo.png" alt="" />
      <span>
        SHAHZAD
        <strong>
          ELECTRONICS<span className="brand-dot">.</span>
        </strong>
      </span>
    </a>
  )
}

export function ProductMedia({ product, ...props }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [product.image])
  return (
    <div className="product-image" {...props}>
      {product.image && !failed && (
        <img
          src={product.image}
          alt={product.name}
          onError={() => setFailed(true)}
        />
      )}
      <span className="image-placeholder" hidden={!!product.image && !failed}>
        <Zap size={48} strokeWidth={1} />
      </span>
    </div>
  )
}

export function Dialog({ title, children, onClose, wide = false }) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = ref.current
    const selector =
      'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]'
    ;(
      dialog.querySelector('[data-autofocus]') ||
      dialog.querySelector(selector) ||
      dialog
    ).focus({ preventScroll: true })
    const key = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key !== 'Tab') return
      const focusable = [...dialog.querySelectorAll(selector)].filter(
        (el) => el.getClientRects().length,
      )
      const first = focusable[0],
        last = focusable.at(-1)
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', key)
      previous?.focus()
    }
  }, [])
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className={`dialog ${wide ? 'dialog-wide' : ''}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="dialog-header">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

export function ErrorNotice({ children }) {
  return children ? (
    <p className="error-notice" role="alert">
      {children}
    </p>
  ) : null
}
export function EmptyState({ icon: Icon = Zap, title, children }) {
  return (
    <div className="empty-state">
      <Icon size={32} strokeWidth={1.3} />
      <h3>{title}</h3>
      {children}
    </div>
  )
}
