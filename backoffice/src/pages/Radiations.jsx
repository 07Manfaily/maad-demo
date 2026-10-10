import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, ShieldCheck, UserX } from 'lucide-react'
import { useStore } from '../data/store'
import { Avatar, Confirm, EmptyState, PageHeader, SearchInput, useToast } from '../components/ui'
import { formatDate } from '../lib/format'
import { MOTIFS, motifOf, ROLE_LABELS } from '../lib/rules'

export function MotifBadge({ id }) {
  const m = motifOf(id)
  return <span className={`motif-chip motif-chip--${m.tone} motif-chip--static`}>{m.label}</span>
}

export default function Radiations() {
  const { state, restoreRadiation } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [motif, setMotif] = useState('all')
  const [undo, setUndo] = useState(null)
  const list = state.radiations

  const counts = useMemo(() => {
    const c = {}
    for (const r of list) c[r.motif] = (c[r.motif] || 0) + 1
    return c
  }, [list])

  const rows = useMemo(() => {
    const t = q.toLowerCase()
    return list
      .filter((r) => motif === 'all' || r.motif === motif)
      .filter(
        (r) =>
          !t ||
          `${r.person.name} ${r.person.number ?? ''} ${r.person.idNumber ?? ''} ${r.owner?.name ?? ''} ${r.note}`
            .toLowerCase()
            .includes(t),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [list, q, motif])

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Radiés"
        subtitle="Personnes sorties de l’effectif. Elles restent au registre et ne peuvent pas être réinscrites."
      />

      <div className="motif-stats">
        <button className={`motif-stat ${motif === 'all' ? 'active' : ''}`} onClick={() => setMotif('all')}>
          <span>Tous les motifs</span>
          <strong>{list.length}</strong>
        </button>
        {MOTIFS.filter((m) => counts[m.id]).map((m) => (
          <button
            key={m.id}
            className={`motif-stat motif-stat--${m.tone} ${motif === m.id ? 'active' : ''}`}
            onClick={() => setMotif(motif === m.id ? 'all' : m.id)}
          >
            <span>{m.label}</span>
            <strong>{counts[m.id]}</strong>
          </button>
        ))}
      </div>

      <section className="card">
        <div className="card__head">
          <SearchInput value={q} onChange={setQ} placeholder="Nom, n° d’adhésion, CNI, adhérent…" />
          <span className="muted">{rows.length} radié(s)</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Aucun radié">
            {list.length ? 'Aucun résultat pour cette recherche.' : 'Radiez une personne depuis sa fiche ou les listes.'}
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Personne</th>
                  <th>Qualité</th>
                  <th>Motif</th>
                  <th>Radié(e) le</th>
                  <th>Observations</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="row-radiated">
                    <td>
                      <div className="person">
                        <Avatar name={r.person.name} />
                        <span>
                          <strong>{r.person.name}</strong>
                          <small>
                            Né(e) le {formatDate(r.person.birthday)}
                            {r.person.idNumber ? ` · ${r.person.idNumber}` : ''}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td>
                      {r.role === 'member' ? (
                        <>
                          Adhérent <span className="mono">N° {r.person.number}</span>
                          {(r.insureds?.length || 0) + (r.beneficiaries?.length || 0) > 0 && (
                            <small className="block muted">
                              sorti(e) avec {r.insureds.length} sous-couvert(s) et {r.beneficiaries.length} ayant(s)-droit
                            </small>
                          )}
                        </>
                      ) : (
                        <>
                          {ROLE_LABELS[r.role][0].toUpperCase() + ROLE_LABELS[r.role].slice(1)}
                          {r.owner && (
                            <small className="block">
                              de{' '}
                              {state.members.some((m) => m.id === r.owner.id) ? (
                                <Link to={`/adherents/${r.owner.id}`} className="link">
                                  {r.owner.name}
                                </Link>
                              ) : (
                                r.owner.name
                              )}{' '}
                              <span className="mono muted">#{r.owner.number}</span>
                            </small>
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      <MotifBadge id={r.motif} />
                    </td>
                    <td className="nowrap">{formatDate(r.date)}</td>
                    <td className="note-cell">{r.note || <span className="muted">—</span>}</td>
                    <td className="right nowrap">
                      <button
                        className="icon-btn"
                        onClick={() => setUndo(r)}
                        aria-label="Annuler la radiation"
                        title="Annuler la radiation"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="rule-cards rule-cards--2">
        <div className="rule-card">
          <UserX size={22} />
          <strong>Hors effectif</strong>
          <p>Un radié n’apparaît plus dans les listes, les compteurs, le tableau de bord ni les cotisations.</p>
        </div>
        <div className="rule-card">
          <ShieldCheck size={22} />
          <strong>Pas de réinscription</strong>
          <p>Le contrôle des doublons reconnaît les radiés : personne ne peut les réinscrire, sous aucun rôle.</p>
        </div>
      </div>

      <Confirm
        open={!!undo}
        title="Annuler la radiation ?"
        text={`${undo?.person.name} reviendra dans l’effectif${
          undo?.role === 'member' ? ' avec ses sous-couverts, ses ayants-droit et ses cotisations' : ''
        }. À réserver aux erreurs de saisie.`}
        confirmLabel="Réintégrer"
        onCancel={() => setUndo(null)}
        onConfirm={() => {
          const res = restoreRadiation(undo.id)
          if (!res.ok) toast(res.error, 'error')
          else
            toast(
              res.skipped.length
                ? `${undo.person.name} réintégré(e). Déjà inscrits ailleurs : ${res.skipped.join(', ')}`
                : `${undo.person.name} réintégré(e)`,
            )
          setUndo(null)
        }}
      />
    </>
  )
}
