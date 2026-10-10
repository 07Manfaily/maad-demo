import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Baby, HandCoins, HeartHandshake, ShieldCheck, Users, ArrowUpRight } from 'lucide-react'
import { useStore } from '../data/store'
import { Avatar, PageHeader, SearchInput, StatCard } from '../components/ui'
import { fcfa, formatPeriod, formatPhone, shortNumber } from '../lib/format'

const C = { or: '#C9962B', terre: '#B5532A', indigo: '#1F3A5F', iroko: '#6B3F1F', kaolin: '#E9DFCF' }

export default function Dashboard() {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const current = state.periods[state.periods.length - 1]

  const perPeriod = useMemo(
    () =>
      state.periods.map((p) => {
        const cs = state.contributions.filter((c) => c.period === p)
        return {
          period: formatPeriod(p).split(' ')[0].slice(0, 4) + '.',
          encaisse: cs.reduce((s, c) => s + c.pay, 0),
          impaye: cs.reduce((s, c) => s + c.solde, 0),
        }
      }),
    [state],
  )

  const cur = state.contributions.filter((c) => c.period === current)
  const upToDate = cur.filter((c) => c.solde === 0).length
  const partial = cur.length - upToDate
  const none = state.members.length - cur.length
  const pie = [
    { name: 'À jour', value: upToDate, color: C.or },
    { name: 'Paiement partiel', value: partial, color: C.terre },
    { name: 'Pas de cotisation', value: none, color: C.kaolin },
  ]
  const rate = state.members.length ? Math.round((upToDate / state.members.length) * 100) : 0

  const rows = useMemo(() => {
    const t = q.toLowerCase()
    return state.members
      .filter((m) => !t || `${m.name} ${m.number} ${m.phone}`.toLowerCase().includes(t))
      .map((m) => ({
        ...m,
        ins: state.insureds.filter((i) => i.memberId === m.id).length,
        ben: state.beneficiaries.filter((b) => b.memberId === m.id).length,
        status: cur.find((c) => c.memberId === m.id),
      }))
      .slice(0, 8)
  }, [q, state, cur])

  return (
    <>
      <PageHeader
        eyebrow={`Akwaba, ${state.user.name}`}
        title="Tableau de bord"
        subtitle={`Situation de la mutuelle, période de ${formatPeriod(current).toLowerCase()}.`}
        actions={
          <Link to="/cotisations" className="btn btn--primary">
            <HandCoins size={18} /> Enregistrer une cotisation
          </Link>
        }
      />

      <div className="stats">
        <StatCard icon={Users} label="Adhérents" value={shortNumber(state.members.length)} hint={state.radiations.length ? `hors ${state.radiations.length} radié(s)` : 'membres titulaires'} tone="or" />
        <StatCard icon={Baby} label="Sous-couverts" value={shortNumber(state.insureds.length)} hint="5 au maximum par adhérent" tone="indigo" />
        <StatCard icon={HeartHandshake} label="Ayants-droit" value={shortNumber(state.beneficiaries.length)} hint="bénéficiaires déclarés" tone="terre" />
        <StatCard
          icon={ShieldCheck}
          label="Adhérents à jour"
          value={`${rate} %`}
          hint={`${upToDate} sur ${state.members.length} ce mois`}
          tone="vert"
          progress={rate}
        />
      </div>

      <div className="grid-dash">
        <section className="card">
          <div className="card__head">
            <div>
              <h3>Cotisations par mois</h3>
              <p className="muted">Sommes encaissées et restes à payer</p>
            </div>
            <div className="legend">
              <span><i style={{ background: C.or }} /> Encaissé</span>
              <span><i style={{ background: C.terre }} /> Impayé</span>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={perPeriod} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(201,150,43,.08)' }}
                  formatter={(v, n) => [fcfa(v), n === 'encaisse' ? 'Encaissé' : 'Impayé']}
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)' }}
                />
                <Bar dataKey="encaisse" fill={C.or} radius={[6, 6, 0, 0]} />
                <Bar dataKey="impaye" fill={C.terre} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card__head">
            <div>
              <h3>Statut des adhérents</h3>
              <p className="muted">{formatPeriod(current)}</p>
            </div>
          </div>
          <div className="donut">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none">
                  {pie.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut__center">
              <strong>{rate}%</strong>
              <span>à jour</span>
            </div>
          </div>
          <ul className="pie-legend">
            {pie.map((p) => (
              <li key={p.name}>
                <i style={{ background: p.color }} /> {p.name} <b>{p.value}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="card__head">
          <div>
            <h3>Adhérents</h3>
            <p className="muted">Avec leurs sous-couverts et ayants-droit</p>
          </div>
          <div className="card__tools">
            <SearchInput value={q} onChange={setQ} placeholder="Nom, n° d’adhésion, téléphone…" />
            <Link to="/adherents" className="btn btn--ghost">
              Tout voir <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Adhérent</th>
                <th>N° d’adhésion</th>
                <th>Contact</th>
                <th>Sous-couverts</th>
                <th>Ayants-droit</th>
                <th>Statut du mois</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="person">
                      <Avatar name={m.name} />
                      <strong>{m.name}</strong>
                    </div>
                  </td>
                  <td className="mono">{m.number}</td>
                  <td>{formatPhone(m.phone)}</td>
                  <td>
                    <span className="count count--indigo">{m.ins}</span>
                  </td>
                  <td>
                    <span className="count count--terre">{m.ben}</span>
                  </td>
                  <td>
                    <StatusBadge c={m.status} />
                  </td>
                  <td className="right">
                    <Link className="btn btn--soft btn--sm" to={`/adherents/${m.id}`}>
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export function StatusBadge({ c }) {
  if (!c) return <span className="badge badge--neutral">Pas de cotisation</span>
  return c.solde === 0 ? (
    <span className="badge badge--ok">À jour</span>
  ) : (
    <span className="badge badge--warn">Reste {fcfa(c.solde)}</span>
  )
}
