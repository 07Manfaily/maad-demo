import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildSeed } from './seed'
import { computeContribution, duplicateMessage, validatePerson } from '../lib/rules'

const KEY = 'maad-demo-v1'
const StoreContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s.version === 1) return s
    }
  } catch {
    /* stockage indisponible : on repart des données fictives */
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
      reset,
    }),
    [state, authed, login, logout, savePerson, removePerson, addPeriod, saveContribution, updateUser, importMembers, reset],
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
