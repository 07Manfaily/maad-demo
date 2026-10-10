import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildSeed } from './seed'
import { computeContribution, duplicateMessage, findRegistered, validatePerson } from '../lib/rules'

// Changer de version écarte les données enregistrées par les anciennes démos.
const VERSION = 2
const KEY = `maad-demo-v${VERSION}`
const StoreContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s.version === VERSION) return s
    }
  } catch {
    /* stockage indisponible : on repart des données fictives */
  }
  try {
    for (let v = 1; v < VERSION; v++) localStorage.removeItem(`maad-demo-v${v}`)
  } catch {
    /* ignore */
  }
  return buildSeed()
}

let counter = Date.now()
const uid = (p) => `${p}${(counter++).toString(36)}`

const COLLECTION = { member: 'members', insured: 'insureds', beneficiary: 'beneficiaries' }

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem('maad-auth') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const login = useCallback(() => {
    setAuthed(true)
    try {
      sessionStorage.setItem('maad-auth', '1')
    } catch {
      /* ignore */
    }
  }, [])
  const logout = useCallback(() => {
    setAuthed(false)
    try {
      sessionStorage.removeItem('maad-auth')
    } catch {
      /* ignore */
    }
  }, [])

  // Enregistre (création ou modification) une personne en appliquant toutes les règles.
  const savePerson = useCallback(
    (kind, data, existingId = null) => {
      const exclude = existingId ? { role: kind, id: existingId } : null
      const { errors, duplicate } = validatePerson(kind, data, state, exclude)
      if (duplicate) {
        const by = state.members.find((m) => m.id === data.memberId)
        setState((s) => ({
          ...s,
          rejections: [
            {
              id: uid('r'),
              at: new Date().toISOString(),
              attempted: { name: data.name, birthday: data.birthday, role: kind },
              by: by ? { name: by.name, number: by.number } : null,
              found: {
                role: duplicate.role,
                ownerName: duplicate.owner?.name ?? null,
                ownerNumber: duplicate.owner?.number ?? duplicate.number,
                radiation: duplicate.radiation
                  ? { motif: duplicate.radiation.motif, date: duplicate.radiation.date }
                  : null,
              },
              agent: s.user.name,
            },
            ...s.rejections,
          ],
        }))
        return { ok: false, errors, duplicate, message: duplicateMessage(duplicate) }
      }
      if (Object.keys(errors).length) return { ok: false, errors }
      const col = COLLECTION[kind]
      const clean = { ...data, name: data.name.trim() }
      setState((s) => {
        if (existingId) {
          return { ...s, [col]: s[col].map((x) => (x.id === existingId ? { ...x, ...clean } : x)) }
        }
        const record = { id: uid(kind[0]), createdAt: new Date().toISOString().slice(0, 10), ...clean }
        if (kind === 'insured' && !record.code) {
          const owner = s.members.find((m) => m.id === record.memberId)
          const n = s.insureds.filter((i) => i.memberId === record.memberId).length + 1
          record.code = `${owner?.number ?? '0000'}-${n}`
        }
        return { ...s, [col]: [...s[col], record] }
      })
      return { ok: true }
    },
    [state],
  )

  const removePerson = useCallback((kind, id) => {
    setState((s) => {
      if (kind === 'member') {
        return {
          ...s,
          members: s.members.filter((m) => m.id !== id),
          insureds: s.insureds.filter((x) => x.memberId !== id),
          beneficiaries: s.beneficiaries.filter((x) => x.memberId !== id),
          contributions: s.contributions.filter((x) => x.memberId !== id),
        }
      }
      const col = COLLECTION[kind]
      return { ...s, [col]: s[col].filter((x) => x.id !== id) }
    })
  }, [])

  // Radiation : la personne sort de l'effectif (listes, compteurs, cotisations)
  // mais reste au registre des radiés, ce qui bloque toute réinscription.
  // Un adhérent radié emporte ses sous-couverts, ayants-droit et cotisations,
  // archivés avec lui ; ces proches ne sont pas radiés et peuvent être réinscrits ailleurs.
  const radiate = useCallback((kind, id, { motif, date, note }) => {
    setState((s) => {
      const col = COLLECTION[kind]
      const person = s[col].find((x) => x.id === id)
      if (!person) return s
      const owner = kind === 'member' ? null : s.members.find((m) => m.id === person.memberId)
      const record = {
        id: uid('x'),
        role: kind,
        person,
        owner: owner ? { id: owner.id, name: owner.name, number: owner.number } : null,
        motif,
        date,
        note: (note || '').trim(),
        agent: s.user.name,
        at: new Date().toISOString(),
      }
      if (kind === 'member') {
        record.insureds = s.insureds.filter((x) => x.memberId === id)
        record.beneficiaries = s.beneficiaries.filter((x) => x.memberId === id)
        record.contributions = s.contributions.filter((x) => x.memberId === id)
        return {
          ...s,
          members: s.members.filter((m) => m.id !== id),
          insureds: s.insureds.filter((x) => x.memberId !== id),
          beneficiaries: s.beneficiaries.filter((x) => x.memberId !== id),
          contributions: s.contributions.filter((x) => x.memberId !== id),
          radiations: [record, ...s.radiations],
        }
      }
      return { ...s, [col]: s[col].filter((x) => x.id !== id), radiations: [record, ...s.radiations] }
    })
  }, [])

  // Annule une radiation (erreur de saisie). Les proches réinscrits entre-temps ailleurs ne reviennent pas.
  const restoreRadiation = useCallback(
    (radId) => {
      const r = state.radiations.find((x) => x.id === radId)
      if (!r) return { ok: false, error: 'Radiation introuvable.' }
      const base = { ...state, radiations: state.radiations.filter((x) => x.id !== radId) }
      if (r.role === 'member') {
        if (base.members.some((m) => m.number === r.person.number))
          return { ok: false, error: `Le n° d’adhésion ${r.person.number} a été réattribué entre-temps.` }
      } else if (!base.members.some((m) => m.id === r.person.memberId)) {
        return { ok: false, error: `L’adhérent ${r.owner?.name ?? ''} ne fait plus partie de l’effectif.` }
      }
      if (findRegistered(base, r.person)) return { ok: false, error: `${r.person.name} a été réinscrit(e) entre-temps.` }
      const col = COLLECTION[r.role]
      const skipped = []
      const keep = (list) =>
        (list || []).filter((p) => {
          const taken = findRegistered(base, p)
          if (taken) skipped.push(p.name)
          return !taken
        })
      const ins = r.role === 'member' ? keep(r.insureds) : []
      const ben = r.role === 'member' ? keep(r.beneficiaries) : []
      setState((s) => ({
        ...s,
        radiations: s.radiations.filter((x) => x.id !== radId),
        [col]: [...s[col], r.person],
        insureds: r.role === 'member' ? [...s.insureds, ...ins] : r.role === 'insured' ? [...s.insureds, r.person] : s.insureds,
        beneficiaries:
          r.role === 'member'
            ? [...s.beneficiaries, ...ben]
            : r.role === 'beneficiary'
              ? [...s.beneficiaries, r.person]
              : s.beneficiaries,
        contributions: r.role === 'member' ? [...s.contributions, ...(r.contributions || [])] : s.contributions,
      }))
      return { ok: true, skipped }
    },
    [state],
  )

  const addPeriod = useCallback(
    (period) => {
      if (!/^\d{4}-\d{2}$/.test(period)) return { ok: false, error: 'Choisissez un mois valide.' }
      if (state.periods.includes(period)) return { ok: false, error: 'Cette période a déjà été enregistrée.' }
      setState((s) => ({ ...s, periods: [...s.periods, period].sort() }))
      return { ok: true }
    },
    [state.periods],
  )

  const saveContribution = useCallback(
    ({ memberId, period, price, pay }, existingId = null) => {
      const errors = {}
      if (!memberId) errors.memberId = 'Choisissez l’adhérent.'
      if (!period) errors.period = 'Choisissez la période.'
      if (!price) errors.price = 'Choisissez le montant.'
      if (pay === '' || Number(pay) < 0 || Number.isNaN(Number(pay))) errors.pay = 'Saisissez la somme payée.'
      if (!existingId && state.contributions.some((c) => c.memberId === memberId && c.period === period))
        errors.memberId = 'Cet adhérent a déjà une cotisation sur cette période : modifiez-la plutôt.'
      if (Object.keys(errors).length) return { ok: false, errors }
      const count = state.insureds.filter((i) => i.memberId === memberId).length
      const calc = computeContribution(price, count, pay)
      const rec = { memberId, period, price: Number(price), pay: Number(pay), insured: count, ...calc }
      setState((s) => ({
        ...s,
        periods: s.periods.includes(period) ? s.periods : [...s.periods, period].sort(),
        contributions: existingId
          ? s.contributions.map((c) => (c.id === existingId ? { ...c, ...rec } : c))
          : [...s.contributions, { id: uid('c'), date: new Date().toISOString().slice(0, 10), ...rec }],
      }))
      return { ok: true }
    },
    [state],
  )

  const updateUser = useCallback((user) => setState((s) => ({ ...s, user: { ...s.user, ...user } })), [])
  const importMembers = useCallback((rows) => {
    setState((s) => ({ ...s, members: [...s.members, ...rows.map((r) => ({ id: uid('m'), ...r }))] }))
  }, [])
  const reset = useCallback(() => setState(buildSeed()), [])

  const value = useMemo(
    () => ({
      state,
      authed,
      login,
      logout,
      savePerson,
      removePerson,
      addPeriod,
      saveContribution,
      updateUser,
      importMembers,
      radiate,
      restoreRadiation,
      reset,
    }),
    [
      state,
      authed,
      login,
      logout,
      savePerson,
      removePerson,
      addPeriod,
      saveContribution,
      updateUser,
      importMembers,
      radiate,
      restoreRadiation,
      reset,
    ],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)

// Petits sélecteurs partagés.
export function memberStats(state, memberId) {
  return {
    insureds: state.insureds.filter((i) => i.memberId === memberId),
    beneficiaries: state.beneficiaries.filter((b) => b.memberId === memberId),
    contributions: state.contributions
      .filter((c) => c.memberId === memberId)
      .sort((a, b) => b.period.localeCompare(a.period)),
  }
}

export function memberStatus(state, memberId, period) {
  const c = state.contributions.find((x) => x.memberId === memberId && x.period === period)
  if (!c) return 'none'
  return c.solde === 0 ? 'ok' : 'partial'
}
