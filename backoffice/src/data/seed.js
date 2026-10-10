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

  // Radiés fictifs : quelques adhérents (décès, vol, impayés, fraude) et des proches décédés.
  // Ils sortent de l'effectif mais restent au registre.
  const busy = new Set([owner0.id, other.id, members[5].id, members[9].id])
  const pool = members.filter((m) => !busy.has(m.id))
  const radiations = []
  let xid = 1
  const out = (kind, person, motif, date, note) => {
    const owner = kind === 'member' ? null : members.find((m) => m.id === person.memberId)
    const rec = {
      id: `x${xid++}`,
      role: kind,
      person,
      owner: owner ? { id: owner.id, name: owner.name, number: owner.number } : null,
      motif,
      date,
      note,
      agent: 'Admin MAAD',
      at: `${date}T09:30:00`,
    }
    if (kind === 'member') {
      rec.insureds = insureds.filter((x) => x.memberId === person.id)
      rec.beneficiaries = beneficiaries.filter((x) => x.memberId === person.id)
      // Plus de cotisation après la date de radiation.
      rec.contributions = contributions.filter((x) => x.memberId === person.id && x.period <= date.slice(0, 7))
    }
    radiations.push(rec)
  }
  const [dead1, thief, unpaid, fraud, dead2] = [pool[10], pool[17], pool[24], pool[29], pool[33]]
  out('member', dead1, 'deces', '2026-05-18', 'Acte de décès transmis par la famille.')
  out('member', thief, 'vol', '2026-06-09', 'Détournement de cotisations collectées pour le groupe de quartier.')
  out('member', unpaid, 'impayes', '2026-07-31', 'Aucune cotisation depuis plus de trois mois malgré deux relances.')
  out('member', fraud, 'fraude', '2026-08-22', 'Sous-couvert déclaré sous une fausse date de naissance.')
  out('member', dead2, 'deces', '2026-09-03', '')
  const gone = new Set([dead1, thief, unpaid, fraud, dead2].map((m) => m.id))
  const deadInsured = insureds.find((x) => !gone.has(x.memberId) && !busy.has(x.memberId) && x !== ins0)
  out('insured', deadInsured, 'deces', '2026-08-11', 'Décès à la suite d’une longue maladie.')
  const deadBenef = beneficiaries.filter((x) => !gone.has(x.memberId) && !busy.has(x.memberId))[6]
  out('beneficiary', deadBenef, 'deces', '2026-09-20', '')

  // Une tentative de réinscription d'un radié, refusée par la règle.
  rejections.unshift({
    id: 'r3',
    at: '2026-10-02T11:15:00',
    attempted: { name: thief.name, birthday: thief.birthday, role: 'member' },
    by: null,
    found: { role: 'member', ownerName: null, ownerNumber: thief.number, radiation: { motif: 'vol', date: '2026-06-09' } },
    agent: 'Admin MAAD',
  })

  const outIds = new Set([...gone, deadInsured.id, deadBenef.id])
  const active = (x) => !outIds.has(x.id) && !gone.has(x.memberId)

  return {
    version: 2,
    user: { name: 'Admin MAAD', email: 'admin@maad.ci' },
    members: members.filter(active),
    insureds: insureds.filter(active),
    beneficiaries: beneficiaries.filter(active),
    periods: [...PERIODS],
    contributions: contributions.filter(active),
    rejections,
    radiations: radiations.sort((a, b) => b.date.localeCompare(a.date)),
  }
}
