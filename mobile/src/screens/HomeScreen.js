import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Motif, StoolMark } from '../components/Logo'
import { PaymentItem } from './HistoryScreen'
import { Avatar, Button, Card, OperatorBadge, SectionTitle, StatusPill } from '../components/ui'
import { CURRENT_PERIOD, useStore } from '../data/store'
import { fcfa, formatPeriod } from '../lib/format'
import { C, OPERATORS } from '../theme'

export default function HomeScreen({ nav }) {
  const { view } = useStore()
  const insets = useSafeAreaInsets()
  const { member, insureds, monthly, price, unpaid, totalDue, upToDate, payments, rows } = view
  const firstName = member.name.split(' ').slice(1).join(' ') || member.name
  const current = rows.find((r) => r.period === CURRENT_PERIOD)
  const paidThisYear = rows.reduce((s, r) => s + r.pay, 0)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={[st.hero, { paddingTop: insets.top + 14 }]}>
        <View style={st.topRow}>
          <View style={st.logoChip}>
            <StoolMark size={26} />
            <Text style={st.logoText}>MAAD</Text>
          </View>
          <Pressable onPress={() => nav.setTab('profile')} accessibilityLabel="Mon profil">
            <Avatar name={member.name} size={40} dark />
          </Pressable>
        </View>
        <Text style={st.hello}>Bonjour {firstName}</Text>
        <Text style={st.sub}>Adhérent N° {member.number}</Text>

        <View style={st.balance}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={st.balanceLabel}>{upToDate ? 'Cotisations' : 'Reste à payer'}</Text>
            <StatusPill ok={upToDate} />
          </View>
          <Text style={st.balanceValue}>{upToDate ? 'Tout est réglé' : fcfa(totalDue)}</Text>
          <Text style={st.balanceHint}>
            {upToDate
              ? 'Merci ! Vous pouvez aussi payer les prochains mois d’avance.'
              : `${unpaid.length} mois à régler · le plus ancien : ${formatPeriod(unpaid[unpaid.length - 1].period)}`}
          </Text>
          <Button
            title={upToDate ? 'Payer d’avance' : 'Payer ma cotisation'}
            icon="phone-portrait-outline"
            variant="gold"
            onPress={() => nav.push('pay')}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
      <Motif height={8} opacity={0.9} />

      <View style={{ padding: 18, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Stat icon="people" label="Personnes couvertes" value={`${1 + insureds.length}`} onPress={() => nav.setTab('family')} />
          <Stat icon="calendar" label="Par mois" value={fcfa(monthly)} onPress={() => nav.setTab('contributions')} />
        </View>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={st.iconBox}>
              <Ionicons name="calculator-outline" size={22} color={C.iroko} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.cardTitle}>Comment est calculée ma cotisation ?</Text>
              <Text style={st.cardText}>
                {fcfa(price)} × {1 + insureds.length} personne{insureds.length ? 's' : ''} (vous et vos {insureds.length}{' '}
                sous-couvert{insureds.length > 1 ? 's' : ''}) = {fcfa(monthly)} par mois.
              </Text>
            </View>
          </View>
          {current ? (
            <View style={st.currentRow}>
              <Text style={st.cardText}>{formatPeriod(current.period)}</Text>
              <StatusPill ok={current.solde === 0} label={current.solde === 0 ? 'Payé' : `${fcfa(current.solde)} dû`} />
            </View>
          ) : null}
        </Card>

        <SectionTitle>Payez avec</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {OPERATORS.map((o) => (
            <Pressable key={o.id} style={st.op} onPress={() => nav.push('pay', { operator: o.id })}>
              <OperatorBadge id={o.id} size={42} />
              <Text style={st.opName} numberOfLines={1}>
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle action="Tout voir" onAction={() => nav.setTab('history')}>
          Derniers paiements
        </SectionTitle>
        <Card style={{ paddingVertical: 4 }}>
          {payments.slice(0, 3).map((p, i) => (
            <PaymentItem key={p.id} p={p} first={i === 0} onPress={() => nav.push('receipt', { id: p.id })} />
          ))}
          {payments.length === 0 ? <Text style={[st.cardText, { paddingVertical: 14 }]}>Aucun paiement pour l’instant.</Text> : null}
        </Card>

        <Text style={st.foot}>Total versé depuis avril 2026 : {fcfa(paidThisYear)}</Text>
      </View>
    </ScrollView>
  )
}

function Stat({ icon, label, value, onPress }) {
  return (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
      <Card style={{ gap: 8 }}>
        <Ionicons name={icon} size={20} color={C.or} />
        <Text style={st.statValue}>{value}</Text>
        <Text style={st.statLabel}>{label}</Text>
      </Card>
    </Pressable>
  )
}

const st = StyleSheet.create({
  hero: { backgroundColor: C.ebene, paddingHorizontal: 18, paddingBottom: 22 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  logoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.kaolin,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoText: { fontWeight: '900', letterSpacing: 3, color: C.ebene },
  hello: { color: C.kaolin, fontSize: 26, fontWeight: '800' },
  sub: { color: '#A99A88', fontSize: 14, marginTop: 4 },
  balance: { marginTop: 18, backgroundColor: C.ebene2, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#3A2F26' },
  balanceLabel: { color: '#CDBFAE', fontSize: 14, fontWeight: '600' },
  balanceValue: { color: C.orLight, fontSize: 32, fontWeight: '900', marginTop: 8, letterSpacing: -0.5 },
  balanceHint: { color: '#A99A88', fontSize: 13, marginTop: 6, lineHeight: 18 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.orSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.ebene },
  cardText: { fontSize: 13, color: C.muted, marginTop: 3, lineHeight: 19 },
  currentRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: C.ebene },
  statLabel: { fontSize: 12, color: C.muted },
  op: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  opName: { fontSize: 11, fontWeight: '700', color: C.ebene },
  foot: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 4 },
})
