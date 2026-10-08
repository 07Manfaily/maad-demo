import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarPlus, CheckCircle2, Pencil, Plus, Wallet } from 'lucide-react'
import { useStore } from '../data/store'
import { Avatar, EmptyState, Field, Modal, PageHeader, SearchInput, StatCard, useToast } from '../components/ui'
import { fcfa, formatPeriod, formatPhone } from '../lib/format'
import { computeContribution, PRICES } from '../lib/rules'
import { StatusBadge } from './Dashboard'

export default function Contributions() {
  const { state } = useStore()
  const [period, setPeriod] = useState(state.periods[state.periods.length - 1])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null)
  const [periodOpen, setPeriodOpen] = useState(false)

  const cs = state.contributions.filter((c) => c.period === period)
  const upToDate = cs.filter((c) => c.solde === 0).length
  const total = state.members.length
  const cash = cs.reduce((s, c) => s + c.pay, 0)
  const unpaid = cs.reduce((s, c) => s + c.solde, 0)

  const rows = useMemo(() => {
    const t = q.toLowerCase()
    return state.members
      .map((m) => ({ m, c: cs.find((x) => x.memberId === m.id) }))
      .filter(({ m }) => !t || `${m.name} ${m.number} ${m.phone}`.toLowerCase().includes(t))
      .filter(({ c }) =>
        filter === 'all' ? true : filter === 'ok' ? c?.solde === 0 : filter === 'partial' ? c && c.solde > 0 : !c,
      )
      .sort((a, b) => a.m.name.localeCompare(b.m.name))
  }, [q, filter, cs, state.members])

  return (
    <>
      <PageHeader
        eyebrow="Finances"
        title="Cotisations"
        subtitle="Montant dû = tarif mensuel × (l’adhérent + ses sous-couverts)."
        actions={
          <>
            <button className="btn btn--ghost" onClick={() => setPeriodOpen(true)}>
              <CalendarPlus size={17} /> Nouvelle période
            </button>
            <button className="btn btn--primary" onClick={() => setForm({ period })}>
              <Plus size={18} /> Cotiser
            </button>
          </>
        }
      />

      <div className="period-tabs" role="tablist">
        {state.periods.map((p) => (
          <button key={p} className={p === period ? 'active' : ''} onClick={() => setPeriod(p)}>
            {formatPeriod(p)}
          </button>
        ))}
      </div>

      <div className="stats">
        <StatCard icon={CheckCircle2} label="Adhérents à jour" value={`${upToDate} / ${total}`} tone="vert" progress={(upToDate / total) * 100} />
        <StatCard icon={AlertTriangle} label="Adhérents non à jour" value={`${total - upToDate} / ${total}`} tone="terre" progress={((total - upToDate) / total) * 100} />
        <StatCard icon={Wallet} label="Solde en caisse" value={fcfa(cash)} hint={`${cs.length} paiement(s)`} tone="or" />
        <StatCard icon={AlertTriangle} label="Impayés" value={fcfa(unpaid)} hint="restes à payer de la période" tone="indigo" />
      </div>

      <section className="card">
        <div className="card__head">
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher un adhérent…" />
          <div className="segmented">
            {[
              ['all', 'Tous'],
              ['ok', 'À jour'],
              ['partial', 'Partiel'],
              ['none', 'Sans cotisation'],
            ].map(([k, l]) => (
              <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Aucun adhérent pour ce filtre" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Adhérent</th>
                  <th>N°</th>
                  <th>Contact</th>
                  <th>Personnes</th>
                  <th>À payer</th>
                  <th>Payé</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ m, c }) => (
                  <tr key={m.id}>
                    <td>
                      <Link to={`/adherents/${m.id}`} className="person">
                        <Avatar name={m.name} />
                        <strong>{m.name}</strong>
                      </Link>
                    </td>
                    <td className="mono">{m.number}</td>
                    <td>{formatPhone(m.phone)}</td>
                    <td>{c ? 1 + c.insured : '—'}</td>
                    <td>{c ? fcfa(c.mustPay) : '—'}</td>
                    <td>{c ? fcfa(c.pay) : '—'}</td>
                    <td>
                      <StatusBadge c={c} />
                    </td>
                    <td className="right">
                      {c ? (
                        <button className="icon-btn" onClick={() => setForm(c)} aria-label="Modifier">
                          <Pencil size={16} />
                        </button>
                      ) : (
                        <button className="btn btn--soft btn--sm" onClick={() => setForm({ period, memberId: m.id })}>
                          Cotiser
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={!!form} title={form?.id ? 'Modifier la cotisation' : 'Nouvelle cotisation'} onClose={() => setForm(null)}>
        {form && <ContributionForm initial={form} onDone={() => setForm(null)} />}
      </Modal>
      <PeriodModal open={periodOpen} onClose={() => setPeriodOpen(false)} onCreated={setPeriod} />
    </>
  )
}

function ContributionForm({ initial, onDone }) {
  const { state, saveContribution } = useStore()
  const toast = useToast()
  const member0 = state.members.find((m) => m.id === initial.memberId)
  const [d, setD] = useState({
    memberId: initial.memberId || '',
    period: initial.period || '',
    price: initial.price || (member0 && member0.number < '0200' ? 4500 : 5000),
    pay: initial.pay ?? '',
  })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }))
  const count = state.insureds.filter((i) => i.memberId === d.memberId).length
  const calc = computeContribution(d.price, count, d.pay)

  const submit = (e) => {
    e.preventDefault()
    const res = saveContribution(d, initial.id)
    if (res.ok) {
      toast(initial.id ? 'Cotisation mise à jour' : 'Cotisation enregistrée')
      onDone()
    } else setErrors(res.errors)
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="grid-2">
        <Field label="Adhérent" error={errors.memberId}>
          <select value={d.memberId} onChange={set('memberId')} disabled={!!initial.id}>
            <option value="">Sélectionnez un adhérent</option>
            {[...state.members]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · N° {m.number}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Période" error={errors.period}>
          <input type="month" value={d.period} onChange={set('period')} disabled={!!initial.id} />
        </Field>
        <Field label="Tarif mensuel par personne" error={errors.price}>
          <div className="segmented segmented--full">
            {PRICES.map((p) => (
              <button type="button" key={p} className={Number(d.price) === p ? 'active' : ''} onClick={() => setD((x) => ({ ...x, price: p }))}>
                {fcfa(p)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Somme payée" error={errors.pay}>
          <input value={d.pay} onChange={set('pay')} inputMode="numeric" placeholder="0" />
        </Field>
      </div>

      <div className="calc">
        <div>
          <span>Sous-couverts</span>
          <strong>{d.memberId ? count : '—'}</strong>
        </div>
        <div>
          <span>Somme à payer</span>
          <strong>{d.memberId ? fcfa(calc.mustPay) : '—'}</strong>
        </div>
        <div>
          <span>Reste à payer</span>
          <strong className={calc.solde ? 'warn' : 'ok'}>{d.memberId ? fcfa(calc.solde) : '—'}</strong>
        </div>
        <div>
          <span>Statut</span>
          <strong className={calc.solde ? 'warn' : 'ok'}>{d.memberId && d.pay !== '' ? calc.statut : '—'}</strong>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Annuler
        </button>
        <button className="btn btn--primary">{initial.id ? 'Mettre à jour' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}

function PeriodModal({ open, onClose, onCreated }) {
  const { addPeriod } = useStore()
  const toast = useToast()
  const [p, setP] = useState('2026-10')
  const [err, setErr] = useState('')
  return (
    <Modal open={open} title="Ajouter une nouvelle période" onClose={onClose} width={420}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          const r = addPeriod(p)
          if (!r.ok) return setErr(r.error)
          toast(`Période ${formatPeriod(p).toLowerCase()} ouverte`)
          onCreated(p)
          setErr('')
          onClose()
        }}
      >
        <Field label="Mois" error={err}>
          <input type="month" value={p} onChange={(e) => setP(e.target.value)} />
        </Field>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn--primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}
