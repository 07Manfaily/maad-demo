import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Baby, CalendarDays, HeartHandshake, IdCard, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { memberStats, useStore } from '../data/store'
import PersonForm from '../components/PersonForm'
import { Avatar, Confirm, EmptyState, Modal, useToast } from '../components/ui'
import { ageFrom, fcfa, formatDate, formatPeriod, formatPhone } from '../lib/format'
import { MAX_INSUREDS } from '../lib/rules'
import { StatusBadge } from './Dashboard'

export default function MemberDetail() {
  const { id } = useParams()
  const { state, removePerson } = useStore()
  const toast = useToast()
  const [form, setForm] = useState(null) // {kind, initial}
  const [del, setDel] = useState(null)
  const m = state.members.find((x) => x.id === id)
  if (!m) return <EmptyState title="Adhérent introuvable" />

  const { insureds, beneficiaries, contributions } = memberStats(state, m.id)
  const current = state.periods[state.periods.length - 1]
  const paid = contributions.reduce((s, c) => s + c.pay, 0)
  const due = contributions.reduce((s, c) => s + c.solde, 0)

  return (
    <>
      <Link to="/adherents" className="back">
        <ArrowLeft size={16} /> Retour aux adhérents
      </Link>

      <section className="profile-hero">
        <div className="profile-hero__pattern" />
        <Avatar name={m.name} size={84} />
        <div className="profile-hero__main">
          <p className="eyebrow">Adhérent N° {m.number}</p>
          <h1>{m.name}</h1>
          <div className="chips">
            <span><CalendarDays size={15} /> {formatDate(m.birthday)} ({ageFrom(m.birthday)} ans)</span>
            <span><Phone size={15} /> +225 {formatPhone(m.phone)}</span>
            <span><IdCard size={15} /> {m.idNumber || 'CNI non renseignée'}</span>
          </div>
        </div>
        <div className="profile-hero__side">
          <StatusBadge c={contributions.find((c) => c.period === current)} />
          <button className="btn btn--ghost btn--light" onClick={() => setForm({ kind: 'member', initial: m })}>
            <Pencil size={16} /> Modifier
          </button>
        </div>
      </section>

      <div className="stats stats--3">
        <div className="mini"><span>Personnes couvertes</span><strong>{1 + insureds.length}</strong><small>l’adhérent et {insureds.length} sous-couvert(s)</small></div>
        <div className="mini"><span>Total cotisé</span><strong>{fcfa(paid)}</strong><small>{contributions.length} période(s)</small></div>
        <div className="mini mini--warn"><span>Reste à payer</span><strong>{fcfa(due)}</strong><small>toutes périodes</small></div>
      </div>

      <div className="grid-2 grid-2--top">
        <section className="card">
          <div className="card__head">
            <div>
              <h3><Baby size={18} /> Sous-couverts</h3>
              <p className="muted">{insureds.length} / {MAX_INSUREDS} places utilisées</p>
            </div>
            <button
              className="btn btn--soft btn--sm"
              disabled={insureds.length >= MAX_INSUREDS}
              onClick={() => setForm({ kind: 'insured', initial: {} })}
            >
              <Plus size={15} /> Ajouter
            </button>
          </div>
          <div className="slots">
            {Array.from({ length: MAX_INSUREDS }).map((_, i) => (
              <span key={i} className={i < insureds.length ? 'on' : ''} />
            ))}
          </div>
          {insureds.length === 0 ? (
            <EmptyState title="Aucun sous-couvert" />
          ) : (
            <ul className="people">
              {insureds.map((p) => (
                <PersonRow key={p.id} p={p} sub={`${p.lien || 'Sous-couvert'} · ${ageFrom(p.birthday)} ans · code ${p.code}`}
                  onEdit={() => setForm({ kind: 'insured', initial: p })} onDelete={() => setDel({ kind: 'insured', p })} />
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card__head">
            <div>
              <h3><HeartHandshake size={18} /> Ayants-droit</h3>
              <p className="muted">{beneficiaries.length} déclaré(s)</p>
            </div>
            <button className="btn btn--soft btn--sm" onClick={() => setForm({ kind: 'beneficiary', initial: {} })}>
              <Plus size={15} /> Ajouter
            </button>
          </div>
          {beneficiaries.length === 0 ? (
            <EmptyState title="Aucun ayant-droit" />
          ) : (
            <ul className="people">
              {beneficiaries.map((p) => (
                <PersonRow key={p.id} p={p} sub={`${p.lien} · +225 ${formatPhone(p.phone)}`}
                  onEdit={() => setForm({ kind: 'beneficiary', initial: p })} onDelete={() => setDel({ kind: 'beneficiary', p })} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card__head">
          <h3>Historique des cotisations</h3>
        </div>
        {contributions.length === 0 ? (
          <EmptyState title="Aucune cotisation enregistrée" />
        ) : (
          <div className="timeline">
            {contributions.map((c) => (
              <div key={c.id} className={`timeline__item ${c.solde === 0 ? 'is-ok' : 'is-warn'}`}>
                <span className="timeline__dot" />
                <div>
                  <strong>{formatPeriod(c.period)}</strong>
                  <small>
                    Tarif {fcfa(c.price)} × {1 + c.insured} personne(s) = {fcfa(c.mustPay)}
                  </small>
                </div>
                <div className="right">
                  <strong>{fcfa(c.pay)}</strong>
                  <StatusBadge c={c} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={!!form}
        title={
          form?.kind === 'member'
            ? 'Modifier l’adhérent'
            : `${form?.initial?.id ? 'Modifier' : 'Ajouter'} un ${form?.kind === 'insured' ? 'sous-couvert' : 'ayant-droit'}`
        }
        onClose={() => setForm(null)}
      >
        {form && <PersonForm kind={form.kind} initial={form.initial} fixedMemberId={m.id} onDone={() => setForm(null)} />}
      </Modal>
      <Confirm
        open={!!del}
        title="Retirer cette personne ?"
        text={`${del?.p.name} ne sera plus rattaché(e) à ${m.name}.`}
        onCancel={() => setDel(null)}
        onConfirm={() => {
          removePerson(del.kind, del.p.id)
          toast('Personne retirée')
          setDel(null)
        }}
      />
    </>
  )
}

function PersonRow({ p, sub, onEdit, onDelete }) {
  return (
    <li>
      <Avatar name={p.name} size={38} />
      <div>
        <strong>{p.name}</strong>
        <small>{sub}</small>
      </div>
      <div className="people__actions">
        <button className="icon-btn" onClick={onEdit} aria-label="Modifier"><Pencil size={15} /></button>
        <button className="icon-btn icon-btn--danger" onClick={onDelete} aria-label="Retirer"><Trash2 size={15} /></button>
      </div>
    </li>
  )
}
