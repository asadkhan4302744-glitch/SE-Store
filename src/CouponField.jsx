import React, { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { ErrorNotice } from './components'

export default function CouponField({ store }) {
  const [code, setCode] = useState('')
  if (store.couponCode)
    return (
      <div className="sf-coupon-applied" role="status">
        <span>
          <Tag size={15} /> <strong>{store.couponCode}</strong> applied
        </span>
        <button
          type="button"
          onClick={store.removeCoupon}
          disabled={store.submitting}
          aria-label="Remove coupon"
        >
          <X size={16} />
        </button>
      </div>
    )
  return (
    <form
      className="sf-coupon-form"
      onSubmit={(event) => {
        event.preventDefault()
        store.applyCoupon(code)
      }}
    >
      <label htmlFor="coupon-code">Have a discount code?</label>
      <div>
        <input
          id="coupon-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          maxLength={32}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={store.submitting || store.checkingCoupon}
          aria-describedby={store.couponError ? 'coupon-error' : undefined}
          aria-invalid={!!store.couponError}
        />
        <button
          className="sf-button sf-button-outline"
          disabled={
            !code.trim() ||
            store.submitting ||
            store.checkingCoupon ||
            store.invalidCart ||
            store.loading ||
            !!store.error
          }
        >
          {store.checkingCoupon ? 'Checking…' : 'Apply'}
        </button>
      </div>
      <div id="coupon-error">
        <ErrorNotice>{store.couponError}</ErrorNotice>
      </div>
      <small>One code per order. Apply again if you change your bag.</small>
    </form>
  )
}
