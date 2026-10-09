import { useMemo, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { useStore } from '../data/store'
import { duplicateMessage, findRegistered, MAX_INSUREDS } from '../lib/rules'
import { DuplicateAlert, Field, useToast } from './ui'

const EMPTY = { number: '', name: '', birthday: '', phone: '', idNumber: '', lien: '', memberId: '' }

const TITLES = {
  member: { create: 'Adhérent enregistré', update: 'Adhérent mis à jour' },
  insured: { create: 'Sous-couvert enregistré', update: 'Sous-couvert mis à jour' },
  beneficiary: { create: 'Ayant-droit enregistré', update: 'Ayant-droit mis à jour' },
}

// Formulaire commun aux adhérents, sous-couverts et ayants-droit.
// Le contrôle d'unicité s'affiche en direct dès que l'identité correspond à une personne inscrite.
export default function PersonForm({ kind, initial, fixedMemberId, onDone }) {
  const { state, savePerson } = useStore()
  const toast = useToast()
  const [data, setData] = useState({ ...EMPTY, memberId: fixedMemberId || '', ...initial })
  const [errors, setErrors] = useState({})
  const [refused, setRefused] = useState(null)
  const editing = Boolean(initial?.id)
  const set = (k) => (e) => {
    setData((d) => ({ ...d, [k]: e.target.value }))
    setRefused(null)
  }

  const live = useMemo(() => {
    if (!data.idNumber && !(data.name && data.birthday)) return null
    const found = findRegistered(state, data, editing ? { role: kind, id: initial.id } : null)
    return found ? duplicateMessage(found) : null
  }, [state, data, editing, kind, initial])

  const submit = (e) => {
    e.preventDefault()
    const { id, ...payload } = data
    const res = savePerson(kind, payload, editing ? id : null)
    if (res.ok) {
      toast(TITLES[kind][editing ? 'update' : 'create'])
      onDone?.()
    } else {
      setErrors(res.errors || {})
      if (res.duplicate) {
        setRefused(res.message)
        toast('Inscription refusée : personne déjà inscrite', 'error')
      }
    }
  }

  // Pré-remplit le formulaire avec une personne déjà inscrite ailleurs, pour montrer la règle au client.
  const tryRule = () => {
    const pool = [...state.insureds, ...state.beneficiaries].filter((p) => p.memberId !== data.memberId)
    const p = pool[Math.floor(Math.random() * pool.length)]
    if (!p) return
    setData((d) => ({ ...d, name: p.name, birthday: p.birthday, idNumber: '', phone: p.phone || d.phone }))
    setRefused(null)
  }

  const needsMember = kind !== 'member' && !fixedMemberId
  const memberChoices = useMemo(
    () =>
      state.members
        .map((m) => ({ ...m, n: state.insureds.filter((i) => i.memberId === m.id).length }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [state.members, state.insureds],
  )

  return (
    <form onSubmit={submit} className="form" noValidate>
      {!editing && (
        <div className="rule-hint">
          <p>
            Une personne ne peut être inscrite qu’une seule fois à la mutuelle. Le contrôle compare le n° de pièce
            d’identité, ou le nom et la date de naissance.
          </p>
          {kind !== 'member' && (
            <button type="button" className="btn btn--soft btn--sm" onClick={tryRule}>
              <FlaskConical size={15} /> Tester la règle
            </button>
          )}
        </div>
      )}

      <DuplicateAlert message={refused || live} live={!refused} />

      <div className="grid-2">
        {needsMember && (
          <Field label="Adhérent" error={errors.memberId}>
            <select value={data.memberId} onChange={set('memberId')}>
              <option value="">Sélectionnez un adhérent</option>
              {memberChoices.map((m) => (
                <option key={m.id} value={m.id} disabled={kind === 'insured' && m.n >= MAX_INSUREDS}>
                  {m.name} · N° {m.number}
                  {kind === 'insured' ? ` (${m.n}/${MAX_INSUREDS})` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}
        {kind === 'member' && (
          <Field label="N° d’adhésion" error={errors.number} hint="4 chiffres">
            <input value={data.number} onChange={set('number')} inputMode="numeric" maxLength={4} placeholder="0142" />
          </Field>
        )}
        <Field label="Nom et prénoms" error={errors.name}>
          <input value={data.name} onChange={set('name')} placeholder="Kouassi Akissi" />
        </Field>
        <Field label="Date de naissance" error={errors.birthday} hint={kind === 'insured' ? 'Entre 3 et 75 ans' : null}>
          <input type="date" value={data.birthday} onChange={set('birthday')} />
        </Field>
        {kind !== 'member' && (
          <Field label="Lien de parenté" error={errors.lien}>
            <input value={data.lien} onChange={set('lien')} placeholder="Fils, Épouse, Mère…" list="liens" />
            <datalist id="liens">
              {['Épouse', 'Époux', 'Fils', 'Fille', 'Mère', 'Père', 'Frère', 'Sœur', 'Neveu', 'Nièce'].map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>
        )}
        <Field
          label={`Téléphone${kind === 'insured' ? ' (facultatif)' : ''}`}
          error={errors.phone}
          hint="10 chiffres"
        >
          <input value={data.phone} onChange={set('phone')} inputMode="tel" maxLength={10} placeholder="0707123456" />
        </Field>
        <Field label="N° pièce d’identité (CNI)" hint="Facultatif, renforce le contrôle des doublons">
          <input value={data.idNumber} onChange={set('idNumber')} placeholder="CI004512378" />
        </Field>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Annuler
        </button>
        <button className="btn btn--primary">{editing ? 'Mettre à jour' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
