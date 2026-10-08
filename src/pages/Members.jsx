import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useStore } from '../data/store'
import PersonForm from '../components/PersonForm'
import { Avatar, Confirm, EmptyState, Modal, PageHeader, SearchInput, useToast } from '../components/ui'
import { formatDate, formatPhone } from '../lib/format'
import { findRegistered } from '../lib/rules'
import { StatusBadge } from './Dashboard'

export default function Members() {
  const { state, removePerson } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null) // null | {} | member
  const [del, setDel] = useState(null)
  const [importing, setImporting] = useState(false)
  const current = state.periods[state.periods.length - 1]

  const rows = useMemo(() => {
    const t = q.toLowerCase()
    return state.members
      .filter((m) => !t || `${m.name} ${m.number} ${m.phone} ${m.idNumber}`.toLowerCase().includes(t))
      .sort((a, b) => a.number.localeCompare(b.number))
  }, [q, state.members])

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Adhérents"
        subtitle={`${state.members.length} adhérents titulaires d’un numéro d’adhésion.`}
        actions={
          <>
            <button className="btn btn--ghost" onClick={() => setImporting(true)}>
              <Upload size={17} /> Importer
            </button>
            <button className="btn btn--primary" onClick={() => setForm({})}>
              <Plus size={18} /> Nouvel adhérent
            </button>
          </>
        }
      />

      <section className="card">
        <div className="card__head">
          <SearchInput value={q} onChange={setQ} placeholder="Nom, n° d’adhésion, téléphone, CNI…" />
          <span className="muted">{rows.length} résultat(s)</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Aucun adhérent trouvé">Essayez un autre nom ou numéro.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Adhérent</th>
                  <th>N° d’adhésion</th>
                  <th>Né(e) le</th>
                  <th>Contact</th>
                  <th>Personnes couvertes</th>
                  <th>Cotisation du mois</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const ins = state.insureds.filter((i) => i.memberId === m.id).length
                  const ben = state.beneficiaries.filter((b) => b.memberId === m.id).length
                  return (
                    <tr key={m.id}>
                      <td>
                        <Link to={`/adherents/${m.id}`} className="person">
                          <Avatar name={m.name} />
                          <span>
                            <strong>{m.name}</strong>
                            <small>{m.idNumber || 'CNI non renseignée'}</small>
                          </span>
                        </Link>
                      </td>
                      <td className="mono">{m.number}</td>
                      <td>{formatDate(m.birthday)}</td>
                      <td>{formatPhone(m.phone)}</td>
                      <td>
                        <span className="count count--indigo" title="Sous-couverts">{ins}</span>
                        <span className="count count--terre" title="Ayants-droit">{ben}</span>
                      </td>
                      <td>
                        <StatusBadge c={state.contributions.find((c) => c.memberId === m.id && c.period === current)} />
                      </td>
                      <td className="right nowrap">
                        <button className="icon-btn" onClick={() => setForm(m)} aria-label="Modifier">
                          <Pencil size={16} />
                        </button>
                        <button className="icon-btn icon-btn--danger" onClick={() => setDel(m)} aria-label="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={!!form} title={form?.id ? 'Modifier l’adhérent' : 'Nouvel adhérent'} onClose={() => setForm(null)}>
        {form && <PersonForm kind="member" initial={form} onDone={() => setForm(null)} />}
      </Modal>
      <Confirm
        open={!!del}
        title="Supprimer cet adhérent ?"
        text={`${del?.name} sera supprimé, ainsi que ses sous-couverts, ses ayants-droit et ses cotisations.`}
        onCancel={() => setDel(null)}
        onConfirm={() => {
          removePerson('member', del.id)
          toast('Adhérent supprimé')
          setDel(null)
        }}
      />
      <ImportModal open={importing} onClose={() => setImporting(false)} />
    </>
  )
}

const SAMPLE = `Numero;Nom;Telephone;DateNaissance
0901;Ehui Bénédicte;0707112233;1988-03-14
0902;Achi Narcisse;0505998877;1979-11-02`

// Remplace l'import Excel (MembersImport) : CSV séparé par des points-virgules.
function ImportModal({ open, onClose }) {
  const { state, importMembers } = useStore()
  const toast = useToast()
  const [text, setText] = useState(SAMPLE)
  const [report, setReport] = useState(null)

  const run = () => {
    const lines = text.trim().split(/\r?\n/).slice(1)
    const ok = []
    const skipped = []
    const known = { ...state, members: [...state.members] }
    for (const line of lines) {
      const [number, name, phone, birthday] = line.split(';').map((s) => (s || '').trim())
      if (!/^\d{4}$/.test(number) || !name || !/^\d{10}$/.test(phone)) {
        skipped.push(`${name || line} : ligne invalide`)
        continue
      }
      if (known.members.some((m) => m.number === number)) {
        skipped.push(`${name} : n° ${number} déjà attribué`)
        continue
      }
      if (findRegistered(known, { name, birthday, idNumber: '' })) {
        skipped.push(`${name} : personne déjà inscrite`)
        continue
      }
      const rec = { number, name, phone, birthday, idNumber: '', createdAt: new Date().toISOString().slice(0, 10) }
      ok.push(rec)
      known.members.push({ id: `tmp${ok.length}`, ...rec })
    }
    if (ok.length) importMembers(ok)
    setReport({ ok: ok.length, skipped })
    if (ok.length) toast(`${ok.length} adhérent(s) importé(s)`)
  }

  return (
    <Modal
      open={open}
      title="Importer des adhérents"
      onClose={() => {
        setReport(null)
        onClose()
      }}
    >
      <div className="import-head">
        <FileSpreadsheet size={28} />
        <p className="muted">
          Collez le contenu d’un fichier CSV (export Excel) avec les colonnes Numéro, Nom, Téléphone et Date de naissance.
          Les personnes déjà inscrites sont ignorées automatiquement.
        </p>
      </div>
      <textarea className="code-area" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      {report && (
        <div className="import-report">
          <strong>{report.ok} importé(s)</strong>
          {report.skipped.length > 0 && (
            <ul>
              {report.skipped.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="form-actions">
        <button className="btn btn--ghost" onClick={onClose}>
          Fermer
        </button>
        <button className="btn btn--primary" onClick={run}>
          <Upload size={16} /> Importer
        </button>
      </div>
    </Modal>
  )
}
