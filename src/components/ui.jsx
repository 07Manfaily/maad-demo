import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CheckCircle2, Search, ShieldAlert, X, XCircle } from 'lucide-react'
import { initials } from '../lib/format'

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'or', progress }) {
  return (
    <div className={`stat stat--${tone}`}>
      <div className="stat__icon">{Icon && <Icon size={20} />}</div>
      <div className="stat__body">
        <span className="stat__label">{label}</span>
        <strong className="stat__value">{value}</strong>
        {hint && <span className="stat__hint">{hint}</span>}
        {progress != null && (
          <div className="meter" aria-hidden>
            <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

const AVATAR_TONES = ['or', 'indigo', 'terre', 'iroko', 'vert']
export function Avatar({ name, size = 36 }) {
  const tone = AVATAR_TONES[(name || '').length % AVATAR_TONES.length]
  return (
    <span className={`avatar avatar--${tone}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher…' }) {
  return (
    <label className="search">
      <Search size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  )
}

export function Modal({ open, title, onClose, children, width = 560 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()} role="dialog">
        <div className="modal__head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, error, hint, children }) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <div className="empty__motif" />
      <strong>{title}</strong>
      {children && <p className="muted">{children}</p>}
    </div>
  )
}

// Encadré affiché quand la règle « une personne, une seule inscription » bloque l'enregistrement.
export function DuplicateAlert({ message, live }) {
  if (!message) return null
  return (
    <div className={`dup-alert ${live ? 'dup-alert--live' : ''}`} role="alert">
      <ShieldAlert size={22} />
      <div>
        <strong>{live ? 'Personne déjà inscrite' : 'Inscription refusée'}</strong>
        <p>{message}</p>
      </div>
    </div>
  )
}

const ToastContext = createContext(() => {})
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((text, tone = 'success') => {
    const id = Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            {t.tone === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
export const useToast = () => useContext(ToastContext)

export function Confirm({ open, title, text, onCancel, onConfirm, confirmLabel = 'Supprimer' }) {
  return (
    <Modal open={open} title={title} onClose={onCancel} width={440}>
      <p className="muted">{text}</p>
      <div className="form-actions">
        <button className="btn btn--ghost" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn btn--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
