import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Button, Card, Header, Screen, StatusPill } from '../components/ui'
import { CURRENT_PERIOD, useStore } from '../data/store'
import { fcfa, formatPeriod } from '../lib/format'
import { C } from '../theme'

export default function ContributionsScreen({ nav }) {
  const { view } = useStore()
  const { rows, monthly, price, insureds, totalDue, upToDate } = view
  const paidCount = rows.filter((r) => r.solde === 0).length

  return (
    <>
      <Header title="Mes cotisations" subtitle={`${paidCount} mois réglés sur ${rows.length}`} />
      <Screen contentStyle={{ paddingTop: 4 }}>
        <Card style={{ backgroundColor: C.ebene, borderColor: C.ebene }}>
          <Text style={st.darkLabel}>Cotisation mensuelle</Text>
          <Text style={st.darkValue}>{fcfa(monthly)}</Text>
          <Text style={st.darkHint}>
            Tarif {fcfa(price)} × {1 + insureds.length} personne{insureds.length ? 's' : ''} couverte
            {insureds.length ? 's' : ''}
          </Text>
          <View style={st.progressTrack}>
            <View style={[st.progressFill, { width: `${(paidCount / Math.max(rows.length, 1)) * 100}%` }]} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={st.darkHint}>{upToDate ? 'Vous êtes à jour' : `Reste ${fcfa(totalDue)}`}</Text>
            <Text style={st.darkHint}>{Math.round((paidCount / Math.max(rows.length, 1)) * 100)} %</Text>
          </View>
        </Card>

        {!upToDate ? (
          <Button title={`Tout régler · ${fcfa(totalDue)}`} icon="flash-outline" onPress={() => nav.push('pay')} />
        ) : null}

        <Card style={{ paddingVertical: 4 }}>
          {rows.map((r, i) => (
            <Pressable
              key={r.period}
              onPress={() => (r.solde > 0 ? nav.push('pay', { periods: [r.period] }) : null)}
              style={[st.row, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}
            >
              <View style={[st.month, { backgroundColor: r.solde === 0 ? C.vertSoft : C.terreSoft }]}>
                <Ionicons
                  name={r.solde === 0 ? 'checkmark' : r.pay > 0 ? 'hourglass-outline' : 'alert'}
                  size={18}
                  color={r.solde === 0 ? C.vert : C.terre}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.title}>
                  {formatPeriod(r.period)}
                  {r.period === CURRENT_PERIOD ? ' · en cours' : ''}
                </Text>
                <Text style={st.sub}>
                  Dû {fcfa(r.mustPay)} · versé {fcfa(r.pay)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <StatusPill ok={r.solde === 0} label={r.solde === 0 ? 'Payé' : r.pay > 0 ? 'Partiel' : 'Impayé'} />
                {r.solde > 0 ? <Text style={st.rest}>reste {fcfa(r.solde)}</Text> : null}
              </View>
            </Pressable>
          ))}
        </Card>
        <Text style={st.note}>Touchez un mois impayé pour le régler. Un adhérent est « à jour » quand il ne reste rien à payer.</Text>
      </Screen>
    </>
  )
}

const st = StyleSheet.create({
  darkLabel: { color: '#CDBFAE', fontSize: 13, fontWeight: '600' },
  darkValue: { color: C.orLight, fontSize: 30, fontWeight: '900', marginTop: 6 },
  darkHint: { color: '#A99A88', fontSize: 13, marginTop: 4 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#3A2F26', marginTop: 14, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: C.or },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  month: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: C.ebene },
  sub: { fontSize: 12, color: C.muted, marginTop: 3 },
  rest: { fontSize: 12, fontWeight: '700', color: C.terre },
  note: { textAlign: 'center', color: C.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 10 },
})
