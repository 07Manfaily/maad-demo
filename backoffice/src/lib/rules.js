// Règles métier reprises de l'application Laravel, plus la nouvelle règle
// d'unicité : une personne déjà inscrite (comme adhérent, sous-couvert ou
// ayant-droit) ne peut pas être inscrite une seconde fois, par qui que ce soit.

import { ageFrom } from './format'

export const MAX_INSUREDS = 5 // InsuredController::store
export const PRICES = [4500, 5000] // ContributionForm, champ "price"

export const ROLE_LABELS = {
  member: 'adhérent',
  insured: 'sous-couvert',
  beneficiary: 'ayant-droit',
}

// Normalise un nom pour comparer « Kouassi  Akissi » et « KOUASSI akissi ».
export const normalizeName = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z ]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ')

export const normalizeId = (s = '') => s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

// Toutes les personnes déjà inscrites, quel que soit leur rôle.
export function allPeople(state) {
  const byId = Object.fromEntries(state.members.map((m) => [m.id, m]))
  return [
    ...state.members.map((p) => ({ ...p, role: 'member', owner: null })),
    ...state.insureds.map((p) => ({ ...p, role: 'insured', owner: byId[p.memberId] })),
    ...state.beneficiaries.map((p) => ({ ...p, role: 'beneficiary', owner: byId[p.memberId] })),
  ]
}

// Retourne la personne déjà inscrite qui correspond à l'identité saisie, ou null.
// Correspondance : même n° de pièce d'identité, OU même nom + même date de naissance.
export function findRegistered(state, { name, birthday, idNumber }, exclude = null) {
  const n = normalizeName(name)
  const id = normalizeId(idNumber)
  return (
    allPeople(state).find((p) => {
      if (exclude && p.role === exclude.role && p.id === exclude.id) return false
      if (id && normalizeId(p.idNumber) === id) return true
      return n && birthday && normalizeName(p.name) === n && p.birthday === birthday
    }) || null
  )
}

export function duplicateMessage(found) {
  const role = ROLE_LABELS[found.role]
  const where = found.owner
    ? ` de l’adhérent ${found.owner.name} (N° ${found.owner.number})`
    : ` (N° d’adhésion ${found.number})`
  return `${found.name} est déjà inscrit(e) comme ${role}${where}. Une personne ne peut être inscrite qu’une seule fois à la mutuelle.`
}

const phoneOk = (p) => /^\d{10}$/.test(p || '')

// Validation de base (équivalent des FormRequest Laravel).
export function validatePerson(kind, data, state, exclude) {
  const e = {}
  if (!data.name || data.name.trim().length < 5 || data.name.trim().length > 50)
    e.name = 'Le nom et prénoms doivent faire entre 5 et 50 caractères.'
  if (!data.birthday) e.birthday = 'La date de naissance est obligatoire (elle sert au contrôle des doublons).'
  if (data.phone && !phoneOk(data.phone)) e.phone = 'Le numéro doit contenir exactement 10 chiffres.'

  if (kind === 'member') {
    if (!/^\d{4}$/.test(data.number || '')) e.number = 'Le numéro d’adhésion doit contenir 4 chiffres.'
    else if (state.members.some((m) => m.number === data.number && m.id !== exclude?.id))
      e.number = 'Ce numéro d’adhésion est déjà attribué.'
    if (!phoneOk(data.phone)) e.phone = 'Le numéro de téléphone est obligatoire (10 chiffres).'
  }
  if (kind === 'insured') {
    const age = ageFrom(data.birthday)
    if (data.birthday && (age < 3 || age > 75))
      e.birthday = 'Un sous-couvert doit avoir entre 3 et 75 ans.'
    if (!data.memberId) e.memberId = 'Choisissez l’adhérent.'
    else {
      const count = state.insureds.filter((i) => i.memberId === data.memberId && i.id !== exclude?.id).length
      if (count >= MAX_INSUREDS)
        e.memberId = `Cet adhérent a déjà ${MAX_INSUREDS} sous-couverts, le maximum autorisé.`
    }
  }
  if (kind === 'beneficiary') {
    if (!data.memberId) e.memberId = 'Choisissez l’adhérent.'
    if (!data.lien || !/^[\p{L} -]+$/u.test(data.lien))
      e.lien = 'Le lien de parenté est obligatoire et ne contient que des lettres.'
    if (!phoneOk(data.phone)) e.phone = 'Le numéro de téléphone est obligatoire (10 chiffres).'
  }

  const found = findRegistered(state, data, exclude)
  return { errors: e, duplicate: found }
}

// Calcul de la cotisation (ContributionController::getValues) :
// montant dû = tarif × (1 adhérent + nombre de sous-couverts).
export function computeContribution(price, insuredCount, pay) {
  const mustPay = Number(price) * (1 + insuredCount)
  const solde = Math.max(mustPay - (Number(pay) || 0), 0)
  return { mustPay, solde, statut: solde === 0 ? 'À jour' : 'Pas à jour' }
}
