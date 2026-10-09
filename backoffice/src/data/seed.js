// Données fictives générées de façon déterministe (même résultat à chaque
// chargement), pour la démonstration uniquement.

import { computeContribution } from '../lib/rules'

function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const LAST_NAMES = [
  'Kouassi', 'Yao', 'Konan', 'Kouadio', 'N’Guessan', 'Kouamé', 'Brou', 'Assi', 'Achi', 'Ehui',
  'Yapi', 'Kassi', 'Séka', 'Mel', 'Nandjui', 'Aka', 'Bédi', 'Allou', 'Koffi', 'Amani',
  'Tanoh', 'Adou', 'Ahoua', 'Gnagne', 'Lasme',
]
const MALE = [
  'Jean-Marc', 'Ange', 'Fabrice', 'Serge', 'Hervé', 'Rodrigue', 'Désiré', 'Arsène', 'Didier',
  'Franck', 'Olivier', 'Guy-Roland', 'Kouakou', 'Firmin', 'Blaise', 'Josué', 'Narcisse', 'Constant',
]
const FEMALE = [
  'Akissi', 'Amenan', 'Affoué', 'Adjoua', 'Ahou', 'Aya', 'Marie-Laure', 'Christelle', 'Prisca',
  'Josiane', 'Patricia', 'Estelle', 'Evelyne', 'Mireille', 'Bénédicte', 'Raïssa', 'Nadège',
]
const BENEF_LINKS = ['Épouse', 'Époux', 'Mère', 'Père', 'Frère', 'Sœur', 'Fils', 'Fille', 'Neveu', 'Nièce']

export const PERIODS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

export function buildSeed() {
  const r = rng(20260408)
  const pick = (a) => a[Math.floor(r() * a.length)]
  const int = (a, b) => a + Math.floor(r() * (b - a + 1))
  const date = (yFrom, yTo) =>
    `${int(yFrom, yTo)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`
  const phone = () => pick(['07', '05', '01']) + String(int(10000000, 99999999))
  const cni = () => `CI${int(100000000, 999999999)}`
  const usedNames = new Set()
  const person = (female) => {
    let name
    do name = `${pick(LAST_NAMES)} ${pick(female ? FEMALE : MALE)}`
    while (usedNames.has(name))
    usedNames.add(name)
    return name
  }

  const members = []
  const insureds = []
  const beneficiaries = []
  let iid = 1
  let bid = 1

  for (let i = 1; i <= 42; i++) {
    const female = r() < 0.45
    const last = pick(LAST_NAMES)
    const m = {
      id: `m${i}`,
      number: String(i * 3 + 100).padStart(4, '0'),
      name: person(female),
      birthday: date(1958, 1996),
      phone: phone(),
      idNumber: cni(),
      createdAt: `2025-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
    }
    members.push(m)
    const nIns = int(0, 4)
    for (let k = 0; k < nIns; k++) {
      const childF = r() < 0.5
      insureds.push({
        id: `i${iid}`,
        code: `${m.number}-${k + 1}`,
        name: `${m.name.split(' ')[0]} ${pick(childF ? FEMALE : MALE)}`,
        birthday: date(2004, 2021),
        phone: r() < 0.5 ? phone() : '',
        idNumber: r() < 0.3 ? cni() : '',
        memberId: m.id,
        lien: childF ? 'Fille' : 'Fils',
      })
      iid++
    }
    const nBen = int(1, 3)
    for (let k = 0; k < nBen; k++) {
      const lien = pick(BENEF_LINKS)
      const bf = ['Épouse', 'Mère', 'Sœur', 'Fille', 'Nièce'].includes(lien)
      beneficiaries.push({
        id: `b${bid}`,
        name: `${lien === 'Épouse' || lien === 'Époux' ? last : m.name.split(' ')[0]} ${pick(bf ? FEMALE : MALE)}`,
        birthday: date(1950, 2010),
        phone: phone(),
        idNumber: r() < 0.5 ? cni() : '',
        lien,
        memberId: m.id,
      })
      bid++
    }
  }

  // Dédoublonnage des noms générés (la règle d'unicité doit être respectée par les données de départ).
  const seen = new Set()
  for (const p of [...insureds, ...beneficiaries]) {
    while (seen.has(p.name) || usedNames.has(p.name)) p.name = `${p.name.split(' ')[0]} ${pick([...MALE, ...FEMALE])}`
    seen.add(p.name)
  }

  const contributions = []
  let cid = 1
  PERIODS.forEach((period, pi) => {
    members.forEach((m) => {
      const joined = m.createdAt.slice(0, 7) <= period
      if (!joined && r() < 0.5) return
      const roll = r()
      if (roll < 0.1 + pi * 0.01) return // n'a pas cotisé ce mois-ci
      const price = m.number < '0200' ? 4500 : 5000
      const count = insureds.filter((x) => x.memberId === m.id).length
      const full = price * (1 + count)
      const pay = roll < 0.78 ? full : Math.round((full * int(3, 8)) / 10 / 500) * 500
      const c = computeContribution(price, count, pay)
      contributions.push({
        id: `c${cid++}`,
        memberId: m.id,
        period,
        price,
        insured: count,
        pay,
        ...c,
        date: `${period}-${String(int(2, 27)).padStart(2, '0')}`,
      })
    })
  })

  const ins0 = insureds[3]
  const owner0 = members.find((m) => m.id === ins0.memberId)
  const other = members.find((m) => m.id !== owner0.id)
  const rejections = [
    {
      id: 'r1',
      at: '2026-09-14T10:24:00',
      attempted: { name: ins0.name, birthday: ins0.birthday, role: 'insured' },
      by: { name: other.name, number: other.number },
      found: { role: 'insured', ownerName: owner0.name, ownerNumber: owner0.number },
      agent: 'Admin MAAD',
    },
    {
      id: 'r2',
      at: '2026-09-28T16:02:00',
      attempted: { name: members[5].name, birthday: members[5].birthday, role: 'beneficiary' },
      by: { name: members[9].name, number: members[9].number },
      found: { role: 'member', ownerName: null, ownerNumber: members[5].number },
      agent: 'Admin MAAD',
    },
  ]

  return {
    version: 1,
    user: { name: 'Admin MAAD', email: 'admin@maad.ci' },
    members,
    insureds,
    beneficiaries,
    periods: [...PERIODS],
    contributions,
    rejections,
  }
}
