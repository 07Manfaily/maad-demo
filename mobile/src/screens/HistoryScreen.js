import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Card, Header, OperatorBadge, Screen } from '../components/ui'
import { useStore } from '../data/store'
import { fcfa, formatPeriod } from '../lib/format'
import { C, operatorById } from '../theme'

export const formatDateTime = (iso) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} · ${d
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h')}`
}

const shortPeriod = (p) => {
  const [y, m] = p.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short' })
}

export const periodsLabel = (periods) =>
  periods.length === 1
    ? formatPeriod(periods[0])
    : `${periods.length} mois · ${shortPeriod(periods[0])} → ${shortPeriod(periods[periods.length - 1])} ${periods[periods.length - 1].slice(0, 4)}`

export function PaymentItem({ p, first, onPress }) {
  const op = operatorById(p.operator)
  return (
    <Pressable onPress={onPress} style={[st.item, !first && { borderTopWidth: 1, borderTopColor: C.line }]}>
      <OperatorBadge id={p.operator} size={42} />
      <View style={{ flex: 1 }}>
        <Text style={st.itemTitle} numberOfLines={1}>
          {periodsLabel(p.periods)}
        </Text>
        <Text style={st.itemSub}>
          {op.name} · {formatDateTime(p.at)}
        </Text>
      </View>
      <Text style={st.amount}>{fcfa(p.amount)}</Text>
    </Pressable>
  )
}

export default function HistoryScreen({ nav }) {
  const { view } = useStore()
  const { payments } = view
  const viaApp = payments.filter((p) => p.operator !== 'guichet')
  const total = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <>
      <Header title="Mes paiements" subtitle={`${payments.length} paiements · ${fcfa(total)}`} />
      <Screen contentStyle={{ paddingTop: 4 }}>
        <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.indigoSoft, borderColor: '#CBD7E6' }}>
          <Ionicons name="receipt-outline" size={22} color={C.indigo} />
          <Text style={{ flex: 1, color: C.indigo, fontSize: 13, lineHeight: 19 }}>
            Chaque paiement donne un reçu que vous pouvez montrer à l’agence. Les paiements « Guichet MAAD » ont été saisis par
            un agent.{viaApp.length ? ` ${viaApp.length} paiement(s) fait(s) depuis l’appli.` : ''}
          </Text>
        </Card>
        <Card style={{ paddingVertical: 4 }}>
          {payments.map((p, i) => (
            <PaymentItem key={p.id} p={p} first={i === 0} onPress={() => nav.push('receipt', { id: p.id })} />
          ))}
        </Card>
      </Screen>
    </>
  )
}

const st = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: C.ebene },
  itemSub: { fontSize: 12, color: C.muted, marginTop: 3 },
  amount: { fontSize: 15, fontWeight: '800', color: C.ebene },
})
