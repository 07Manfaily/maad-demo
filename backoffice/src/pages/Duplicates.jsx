import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Fingerprint, ShieldAlert, ShieldCheck, Users } from 'lucide-react'
import { useStore } from '../data/store'
import { EmptyState, Field, PageHeader } from '../components/ui'
import { formatDate } from '../lib/format'
import { duplicateMessage, findRegistered, motifOf, ROLE_LABELS } from '../lib/rules'

export default function Duplicates() {
  const { state } = useStore()
  const [probe, setProbe] = useState({ name: '', birthday: '', idNumber: '' })
  const set = (k) => (e) => setProbe((p) => ({ ...p, [k]: e.target.value }))
  const ready = probe.idNumber || (probe.name && probe.birthday)
  const found = useMemo(() => (ready ? findRegistered(state, probe) : null), [state, probe, ready])
  const total = state.members.length + state.insureds.length + state.beneficiaries.length + state.radiations.length

  return (
    <>
      <PageHeader
        eyebrow="Nouvelle règle"
        title="Contrôle des doublons"
        subtitle="Une personne déjà inscrite ne peut pas être inscrite par quelqu’un d’autre."
      />

      <div className="rule-cards">
        <div className="rule-card">
          <Users size={22} />
          <strong>Un seul registre</strong>
          <p>
            Adhérents, sous-couverts, ayants-droit et radiés sont vérifiés ensemble : {total} personnes aujourd’hui, dont{' '}
            {state.radiations.length} radiées.
          </p>
        </div>
        <div className="rule-card">
          <Fingerprint size={22} />
          <strong>Deux critères</strong>
          <p>Même n° de pièce d’identité, ou même nom et prénoms avec la même date de naissance (accents et ordre ignorés).</p>
        </div>
        <div className="rule-card">
          <ShieldCheck size={22} />
          <strong>Blocage immédiat</strong>
          <p>L’alerte apparaît pendant la saisie, et l’enregistrement est refusé avec le nom de l’adhérent qui a déjà inscrit la personne.</p>
        </div>
      </div>

      <div className="grid-2 grid-2--top">
        <section className="card">
          <div className="card__head">
            <div>
              <h3>Vérifier une personne</h3>
              <p className="muted">Avant une inscription, au guichet ou au téléphone.</p>
            </div>
          </div>
          <div className="form">
            <Field label="Nom et prénoms">
              <input value={probe.name} onChange={set('name')} placeholder="Kouassi Akissi" />
            </Field>
            <div className="grid-2">
              <Field label="Date de naissance">
                <input type="date" value={probe.birthday} onChange={set('birthday')} />
              </Field>
              <Field label="N° pièce d’identité">
                <input value={probe.idNumber} onChange={set('idNumber')} placeholder="CI…" />
              </Field>
            </div>
          </div>
          {ready &&
            (found ? (
              <div className="dup-alert" role="status">
                <ShieldAlert size={22} />
                <div>
                  <strong>{found.radiation ? 'Personne radiée' : 'Déjà inscrite'}</strong>
                  <p>{duplicateMessage(found)}</p>
                  {found.radiation ? (
                    <Link className="link" to="/radies">
                      Voir la liste des radiés
                    </Link>
                  ) : (
                    <Link className="link" to={`/adherents/${found.owner?.id ?? found.id}`}>
                      Ouvrir la fiche de l’adhérent
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="ok-alert" role="status">
                <BadgeCheck size={22} />
                <div>
                  <strong>Aucune inscription trouvée</strong>
                  <p>Cette personne peut être inscrite.</p>
                </div>
              </div>
            ))}
        </section>

        <section className="card">
          <div className="card__head">
            <div>
              <h3>Tentatives refusées</h3>
              <p className="muted">Journal des inscriptions bloquées par la règle</p>
            </div>
            <span className="count count--terre">{state.rejections.length}</span>
          </div>
          {state.rejections.length === 0 ? (
            <EmptyState title="Aucune tentative refusée" />
          ) : (
            <ul className="log">
              {state.rejections.map((r) => (
                <li key={r.id}>
                  <ShieldAlert size={18} />
                  <div>
                    <strong>{r.attempted.name}</strong>
                    <p>
                      Tentative comme {ROLE_LABELS[r.attempted.role]}
                      {r.by ? ` pour ${r.by.name} (N° ${r.by.number})` : ''}.{' '}
                      {r.found.radiation
                        ? `Radié(e) le ${formatDate(r.found.radiation.date)}, motif : ${motifOf(r.found.radiation.motif).label.toLowerCase()}.`
                        : `Déjà ${ROLE_LABELS[r.found.role]}${
                            r.found.ownerName
                              ? ` de ${r.found.ownerName} (N° ${r.found.ownerNumber})`
                              : ` (N° ${r.found.ownerNumber})`
                          }.`}
                    </p>
                    <small>
                      {formatDate(r.at)} · {r.agent}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
