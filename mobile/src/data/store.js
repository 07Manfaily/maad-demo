// État de la démo mobile : mêmes données fictives que le back-office, vues
// depuis le compte d'un adhérent. Les paiements Mobile Money sont simulés et
// gardés sur l'appareil (AsyncStorage, localStorage sur le web).

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildSeed, PERIODS } from './seed'
import { computeContribution } from '../lib/rules'

const KEY = 'maad-mobile-v1'
export const DEMO_PIN = '1234'
export const CURRENT_PERIOD = '2026-10'
export const ADVANCE_PERIODS = ['2026-11', '2026-12']
const DUE_PERIODS = [...PERIODS, CURRENT_PERIOD]

const priceOf = (m) => (m.number < '0200' ? 4500 : 5000)

function fresh() {
  return { version: 1, data: buildSeed(), payments: [], memberId: null }
}

// Adhérent proposé sur l'écran de connexion : une famille avec des
// sous-couverts et au moins un mois à régler, pour que la démo parle.
export function pickDemoMember(data) {
  const view = (m) => memberView({ data, payments: [] }, m.id)
  return (
    data.members.find((m) => {
      const v = view(m)
      return v.insureds.length >= 2 && v.unpaid.length >= 2
    }) || data.members[0]
  )
}

export function memberView(state, memberId) {
  const { data } = state
  const member = data.members.find((m) => m.id === memberId)
  if (!member) return null
  const insureds = data.insureds.filter((i) => i.memberId === member.id)
  const beneficiaries = data.beneficiaries.filter((b) => b.memberId === member.id)
  const price = priceOf(member)
  const monthly = price * (1 + insureds.length)
  const joined = member.createdAt.slice(0, 7)

  const rowFor = (period) => {
    const c = data.contributions.find((x) => x.memberId === member.id && x.period === period)
    if (c) return { period, price: c.price, insured: c.insured, mustPay: c.mustPay, pay: c.pay, solde: c.solde, statut: c.statut }
    return { period, price, insured: insureds.length, ...computeContribution(price, insureds.length, 0), pay: 0 }
  }

  const rows = DUE_PERIODS.filter(
    (p) => joined <= p || data.contributions.some((x) => x.memberId === member.id && x.period === p),
  )
    .map(rowFor)
    .reverse()
  const advance = ADVANCE_PERIODS.map(rowFor)
  const unpaid = rows.filter((r) => r.solde > 0)
  const totalDue = unpaid.reduce((s, r) => s + r.solde, 0)
  const totalPaid = rows.reduce((s, r) => s + r.pay, 0)

  // Historique : les cotisations saisies au guichet par l'agent (back-office)
  // puis les paiements faits depuis l'appli.
  const counter = data.contributions
    .filter((c) => c.memberId === member.id && (c.viaApp ? c.counterPay : c.pay) > 0)
    .map((c) => ({
      id: `g-${c.id}`,
      ref: `GUI-${c.period.replace('-', '')}-${member.number}`,
      operator: 'guichet',
      amount: c.viaApp ? c.counterPay : c.pay,
      periods: [c.period],
      at: `${c.date}T09:30:00`,
      status: 'Réussi',
    }))
  const payments = [...state.payments.filter((p) => p.memberId === member.id), ...counter].sort((a, b) =>
    b.at.localeCompare(a.at),
  )

  return {
    member,
    insureds,
    beneficiaries,
    price,
    monthly,
    rows,
    advance,
    unpaid,
    totalDue,
    totalPaid,
    upToDate: totalDue === 0,
    payments,
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(null)

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const s = raw && JSON.parse(raw)
        setState(s && s.version === 1 ? s : fresh())
      })
      .catch(() => setState(fresh()))
  }, [])

  useEffect(() => {
    if (state) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {})
  }, [state])

  const login = useCallback(
    (number, pin) => {
      const m = state.data.members.find((x) => x.number === number.trim())
      if (!m) return 'Aucun adhérent ne correspond à ce numéro d’adhésion.'
      if (pin !== DEMO_PIN) return `Code PIN incorrect (démo : ${DEMO_PIN}).`
      setState((s) => ({ ...s, memberId: m.id }))
      return null
    },
    [state],
  )

  const logout = useCallback(() => setState((s) => ({ ...s, memberId: null })), [])
  const reset = useCallback(() => setState((s) => ({ ...fresh(), memberId: s.memberId })), [])

  // Paiement simulé : solde chaque mois choisi et enregistre la transaction.
  const pay = useCallback(
    ({ periods, operator, phone }) => {
      const s = state
      const view = memberView(s, s.memberId)
      const all = [...view.rows, ...view.advance]
      const contributions = [...s.data.contributions]
      let amount = 0
      for (const period of periods) {
        const row = all.find((r) => r.period === period)
        if (!row || row.solde <= 0) continue
        amount += row.solde
        const i = contributions.findIndex((c) => c.memberId === s.memberId && c.period === period)
        if (i >= 0) {
          const c = contributions[i]
          const payTotal = c.pay + row.solde
          contributions[i] = {
            ...c,
            pay: payTotal,
            ...computeContribution(c.price, c.insured, payTotal),
            viaApp: true,
            counterPay: c.viaApp ? c.counterPay : c.pay,
          }
        } else {
          contributions.push({
            id: `app${Date.now().toString(36)}${period}`,
            memberId: s.memberId,
            period,
            price: row.price,
            insured: row.insured,
            pay: row.solde,
            ...computeContribution(row.price, row.insured, row.solde),
            date: new Date().toISOString().slice(0, 10),
            viaApp: true,
            counterPay: 0,
          })
        }
      }
      const receipt = {
        id: `p${Date.now().toString(36)}`,
        memberId: s.memberId,
        ref: `MAAD-${Date.now().toString(36).toUpperCase().slice(-7)}`,
        operator,
        phone,
        amount,
        periods: [...periods].sort(),
        at: new Date().toISOString(),
        status: 'Réussi',
      }
      setState({ ...s, data: { ...s.data, contributions }, payments: [receipt, ...s.payments] })
      return receipt
    },
    [state],
  )

  const demoMember = useMemo(() => pickDemoMember(buildSeed()), [])

  const value = useMemo(() => {
    if (!state) return null
    return {
      state,
      demoMember,
      view: state.memberId ? memberView(state, state.memberId) : null,
      login,
      logout,
      reset,
      pay,
    }
  }, [state, demoMember, login, logout, reset, pay])

  return createElement(StoreContext.Provider, { value }, children)
}

export const useStore = () => useContext(StoreContext)
