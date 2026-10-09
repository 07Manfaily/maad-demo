import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text, View } from 'react-native'
import { Motif, StoolMark } from '../components/Logo'
import { Button, Card, Header, InfoRow, OperatorBadge, Screen } from '../components/ui'
import { useStore } from '../data/store'
import { fcfa, formatPeriod, formatPhone } from '../lib/format'
import { C, operatorById } from '../theme'
import { formatDateTime } from './HistoryScreen'

export function ReceiptCard({ p, member }) {
  const op = operatorById(p.operator)
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <View style={st.top}>
        <View style={st.check}>
          <Ionicons name="checkmark" size={30} color="#fff" />
        </View>
        <Text style={st.amount}>{fcfa(p.amount)}</Text>
        <Text style={st.status}>Paiement {p.status.toLowerCase()}</Text>
      </View>
      <Motif height={6} opacity={0.6} />
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <OperatorBadge id={p.operator} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: C.ebene }}>{op.name}</Text>
            {p.phone ? <Text style={{ color: C.muted, fontSize: 13 }}>{formatPhone(p.phone)}</Text> : null}
          </View>
        </View>
        <InfoRow label="Référence" value={p.ref} />
        <InfoRow label="Date" value={formatDateTime(p.at)} />
        <InfoRow label="Adhérent" value={`${member.name} · N° ${member.number}`} />
        <InfoRow label="Mois réglés" value={p.periods.map(formatPeriod).join(', ')} />
        <InfoRow label="Frais" value="0 FCFA" />
        <InfoRow label="Total" value={fcfa(p.amount)} strong />
        <View style={st.stamp}>
          <StoolMark size={26} />
          <Text style={st.stampText}>Reçu MAAD · démo, aucun argent n’a été débité</Text>
        </View>
      </View>
    </Card>
  )
}

export default function ReceiptScreen({ nav, params }) {
  const { view } = useStore()
  const p = view.payments.find((x) => x.id === params.id)
  if (!p) return null
  return (
    <>
      <Header title="Reçu" subtitle={p.ref} onBack={nav.back} />
      <Screen contentStyle={{ paddingTop: 4 }}>
        <ReceiptCard p={p} member={view.member} />
        <Button title="Retour" variant="ghost" onPress={nav.back} />
      </Screen>
    </>
  )
}

const st = StyleSheet.create({
  top: { alignItems: 'center', paddingVertical: 22, backgroundColor: C.vertSoft },
  check: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.vert, alignItems: 'center', justifyContent: 'center' },
  amount: { fontSize: 28, fontWeight: '900', color: C.ebene, marginTop: 12 },
  status: { color: C.vert, fontWeight: '700', marginTop: 4 },
  stamp: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stampText: { flex: 1, color: C.muted, fontSize: 12 },
})
