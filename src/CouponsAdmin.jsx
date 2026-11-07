import React, { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Edit3, Plus, Tag } from 'lucide-react'
import { request, money } from './api'
import { Dialog, EmptyState, ErrorNotice } from './components'

const blank = {
  code: '',
  type: 'percentage',
  value: 10,
  minSubtotal: 0,
  active: true,
}

function CouponEditor({ coupon, onClose, onSaved }) {
  const [form, setForm] = useState(coupon || blank)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }))
  async function save(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await request('/admin/coupons', {
        method: coupon ? 'PUT' : 'POST',
        body: {
          ...form,
          value: Number(form.value),
          minSubtotal: Number(form.minSubtotal),
        },
      })
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      title={coupon ? 'Edit coupon' : 'Create a discount coupon'}
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <form className="product-form" onSubmit={save}>
        <fieldset disabled={busy}>
          <label>
            Coupon code
            <input
              data-autofocus
              aria-label="Coupon code"
              aria-describedby="admin-coupon-code-help"
              required
              minLength={3}
              maxLength={32}
              pattern="[A-Za-z0-9_-]{3,32}"
              title="3–32 letters, numbers, hyphens, or underscores"
              value={form.code}
              readOnly={!!coupon}
              onChange={(event) =>
                field('code', event.target.value.toUpperCase())
              }
              placeholder="e.g. WELCOME10"
              autoComplete="off"
              spellCheck={false}
            />
            <small id="admin-coupon-code-help">
              {coupon
                ? 'The code stays the same. Change its discount or availability below.'
                : 'Customers enter this code at checkout.'}
            </small>
          </label>
          <div className="form-row">
            <label>
              Discount type
              <select
                aria-label="Discount type"
                value={form.type}
                onChange={(event) => field('type', event.target.value)}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (Rs.)</option>
              </select>
            </label>
            <label>
              {form.type === 'percentage' ? 'Discount (%)' : 'Discount (Rs.)'}
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                max={form.type === 'percentage' ? 100 : 10000000}
                value={form.value}
                onChange={(event) => field('value', event.target.value)}
              />
            </label>
          </div>
          <label>
            Minimum subtotal (Rs.)
            <input
              aria-label="Minimum subtotal (Rs.)"
              aria-describedby="admin-coupon-minimum-help"
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              value={form.minSubtotal}
              onChange={(event) => field('minSubtotal', event.target.value)}
            />
            <small id="admin-coupon-minimum-help">
              Use 0 for no minimum. Checked before discount and delivery.
            </small>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => field('active', event.target.checked)}
            />
            <span>
              <strong>Active coupon</strong>
              <small>
                Turn off to stop new orders using this code. Existing orders
                keep their discount.
              </small>
            </span>
          </label>
        </fieldset>
        <ErrorNotice>{error}</ErrorNotice>
        <div className="dialog-actions">
          <button
            className="button button-outline"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button className="button button-dark" disabled={busy}>
            {busy ? 'Saving…' : 'Save coupon'} <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Dialog>
  )
}

export default function CouponsAdmin({ refreshKey }) {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null)
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setCoupons((await request('/admin/coupons')).coupons)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    refresh()
  }, [refresh, refreshKey])
  return (
    <>
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Discount coupons{' '}
              <span className="count-label">{coupons.length}</span>
            </h2>
            <p>
              One code per order. Discounts apply to products, with delivery
              calculated as usual.
            </p>
          </div>
          <button className="button button-dark" onClick={() => setEditor({})}>
            <Plus size={16} /> Add coupon
          </button>
        </div>
        <ErrorNotice>{error}</ErrorNotice>
        {loading ? (
          <div className="admin-loading">Loading coupons…</div>
        ) : coupons.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Minimum subtotal</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.code}>
                    <td>
                      <button
                        className="table-link"
                        onClick={() => setEditor({ coupon })}
                      >
                        {coupon.code}
                      </button>
                    </td>
                    <td>
                      {coupon.type === 'percentage'
                        ? `${coupon.value}% off`
                        : `${money(coupon.value)} off`}
                    </td>
                    <td>
                      {coupon.minSubtotal
                        ? money(coupon.minSubtotal)
                        : 'No minimum'}
                    </td>
                    <td>
                      <span
                        className={`visibility-badge ${coupon.active ? 'visible' : ''}`}
                      >
                        {coupon.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Edit coupon ${coupon.code}`}
                        onClick={() => setEditor({ coupon })}
                      >
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !error && (
            <EmptyState icon={Tag} title="A little saving goes a long way.">
              <p>Create a code to give customers a discount at checkout.</p>
            </EmptyState>
          )
        )}
      </section>
      {editor && (
        <CouponEditor
          coupon={editor.coupon}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null)
            refresh()
          }}
        />
      )}
    </>
  )
}
