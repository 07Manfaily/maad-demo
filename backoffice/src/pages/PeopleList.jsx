import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../data/store'
import PersonForm from '../components/PersonForm'
import { Avatar, Confirm, EmptyState, Modal, PageHeader, SearchInput, useToast } from '../components/ui'
import { ageFrom, formatDate, formatPhone } from '../lib/format'

// Liste générique des sous-couverts ou des ayants-droit.
export default function PeopleList({ kind }) {
  const { state, removePerson } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const isInsured = kind === 'insured'
  const list = isInsured ? state.insureds : state.beneficiaries
  const label = isInsured ? 'sous-couvert' : 'ayant-droit'

  const rows = useMemo(() => {
    const byId = Object.fromEntries(state.members.map((m) => [m.id, m]))
    const t = q.toLowerCase()
    return list
      .map((p) => ({ ...p, owner: byId[p.memberId] }))
      .filter((p) => !t || `${p.name} ${p.owner?.name} ${p.owner?.number} ${p.lien}`.toLowerCase().includes(t))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [q, list, state.members])

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title={isInsured ? 'Sous-couverts' : 'Ayants-droit'}
        subtitle={
          isInsured
            ? 'Personnes couvertes par la cotisation d’un adhérent (5 au maximum, de 3 à 75 ans).'
            : 'Bénéficiaires désignés par les adhérents.'
        }
        actions={
          <button className="btn btn--primary" onClick={() => setForm({})}>
            <Plus size={18} /> Nouvel {label}
          </button>
        }
      />
      <section className="card">
        <div className="card__head">
          <SearchInput value={q} onChange={setQ} placeholder="Nom, adhérent, lien…" />
          <span className="muted">{rows.length} personne(s)</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Aucun résultat" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom et prénoms</th>
                  {isInsured && <th>Code</th>}
                  <th>Lien</th>
                  <th>Né(e) le</th>
                  <th>Contact</th>
                  <th>Adhérent</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="person">
                        <Avatar name={p.name} />
                        <span>
                          <strong>{p.name}</strong>
                          <small>{ageFrom(p.birthday)} ans</small>
                        </span>
                      </div>
                    </td>
                    {isInsured && <td className="mono">{p.code}</td>}
                    <td>{p.lien || '—'}</td>
                    <td>{formatDate(p.birthday)}</td>
                    <td>{formatPhone(p.phone)}</td>
                    <td>
                      {p.owner && (
                        <Link to={`/adherents/${p.owner.id}`} className="link">
                          {p.owner.name} <span className="mono muted">#{p.owner.number}</span>
                        </Link>
                      )}
                    </td>
                    <td className="right nowrap">
                      <button className="icon-btn" onClick={() => setForm(p)} aria-label="Modifier">
                        <Pencil size={16} />
                      </button>
                      <button className="icon-btn icon-btn--danger" onClick={() => setDel(p)} aria-label="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Modal open={!!form} title={form?.id ? `Modifier le ${label}` : `Nouvel ${label}`} onClose={() => setForm(null)}>
        {form && (
          <PersonForm
            kind={kind}
            initial={form.id ? (({ owner, ...rest }) => rest)(form) : form}
            onDone={() => setForm(null)}
          />
        )}
      </Modal>
      <Confirm
        open={!!del}
        title={`Supprimer ce ${label} ?`}
        text={`${del?.name} sera retiré(e) de la mutuelle.`}
        onCancel={() => setDel(null)}
        onConfirm={() => {
          removePerson(kind, del.id)
          toast(`${label[0].toUpperCase()}${label.slice(1)} supprimé`)
          setDel(null)
        }}
      />
    </>
  )
}
