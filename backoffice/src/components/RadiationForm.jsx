import { useState } from 'react'
import { UserX } from 'lucide-react'
import { useStore } from '../data/store'
import { MOTIFS, ROLE_LABELS } from '../lib/rules'
import { Field, Modal, useToast } from './ui'

const today = () => new Date().toISOString().slice(0, 10)

// Fenêtre de radiation d'une personne (adhérent, sous-couvert ou ayant-droit).
export default function RadiationModal({ target, onClose, onDone }) {
  return (
    <Modal open={!!target} title="Radier de la mutuelle" onClose={onClose} width={520}>
      {target && <RadiationForm kind={target.kind} person={target.person} onClose={onClose} onDone={onDone} />}
    </Modal>
  )
}

function RadiationForm({ kind, person, onClose, onDone }) {
  const { state, radiate } = useStore()
  const toast = useToast()
  const [motif, setMotif] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})

  const ins = kind === 'member' ? state.insureds.filter((x) => x.memberId === person.id).length : 0
  const ben = kind === 'member' ? state.beneficiaries.filter((x) => x.memberId === person.id).length : 0

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!motif) err.motif = 'Choisissez le motif de radiation.'
    if (!date) err.date = 'Indiquez la date de radiation.'
    else if (date > today()) err.date = 'La date ne peut pas être dans le futur.'
    if (motif === 'autre' && note.trim().length < 5) err.note = 'Précisez le motif en quelques mots.'
    setErrors(err)
    if (Object.keys(err).length) return
    radiate(kind, person.id, { motif, date, note })
    toast(`${person.name} a été radié(e)`)
    onDone?.()
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="radiation-who">
        <UserX size={22} />
        <div>
          <strong>{person.name}</strong>
          <p className="muted">
            {kind === 'member'
              ? `Adhérent N° ${person.number}${ins + ben ? `, avec ${ins} sous-couvert(s) et ${ben} ayant(s)-droit` : ''}.`
              : `${ROLE_LABELS[kind][0].toUpperCase()}${ROLE_LABELS[kind].slice(1)}.`}
          </p>
        </div>
      </div>

      {/* div plutôt que <label> : un clic sur le libellé activerait le premier bouton */}
      <div className={`field ${errors.motif ? 'field--error' : ''}`}>
        <span className="field__label">Motif de radiation</span>
        <div className="motif-picker">
          {MOTIFS.map((m) => (
            <button
              type="button"
              key={m.id}
              className={`motif-chip motif-chip--${m.tone} ${motif === m.id ? 'active' : ''}`}
              onClick={() => setMotif(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        {errors.motif && <span className="field__error">{errors.motif}</span>}
      </div>
      <div className="grid-2">
        <Field label={motif === 'deces' ? 'Date du décès' : 'Date de radiation'} error={errors.date}>
          <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label={`Observations${motif === 'autre' ? '' : ' (facultatif)'}`} error={errors.note}>
        <textarea className="code-area code-area--text" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Décision du bureau, pièce justificative…" />
      </Field>

      <ul className="radiation-effects">
        <li>Sort de l’effectif : listes, compteurs, tableau de bord et cotisations.</li>
        {kind === 'member' && ins + ben > 0 && (
          <li>Ses sous-couverts et ayants-droit sortent en même temps et pourront être inscrits par un autre adhérent.</li>
        )}
        <li>Reste au registre des radiés : personne ne pourra le réinscrire.</li>
      </ul>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Annuler
        </button>
        <button className="btn btn--danger">
          <UserX size={16} /> Radier
        </button>
      </div>
    </form>
  )
}
