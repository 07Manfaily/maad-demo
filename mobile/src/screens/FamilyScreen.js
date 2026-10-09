import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text, View } from 'react-native'
import { Avatar, Card, Header, Screen, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import { ageFrom, formatPhone } from '../lib/format'
import { MAX_INSUREDS } from '../lib/rules'
import { C } from '../theme'

function Person({ p, sub, first }) {
  return (
    <View style={[st.row, !first && { borderTopWidth: 1, borderTopColor: C.line }]}>
      <Avatar name={p.name} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={st.name}>{p.name}</Text>
        <Text style={st.sub}>{sub}</Text>
      </View>
    </View>
  )
}

export default function FamilyScreen() {
  const { view } = useStore()
  const { member, insureds, beneficiaries, price } = view

  return (
    <>
      <Header title="Ma famille" subtitle={`${1 + insureds.length} personnes couvertes`} />
      <Screen contentStyle={{ paddingTop: 4 }}>
        <SectionTitle>Adhérent</SectionTitle>
        <Card style={{ paddingVertical: 4 }}>
          <Person p={member} first sub={`N° ${member.number} · ${ageFrom(member.birthday)} ans · ${formatPhone(member.phone)}`} />
        </Card>

        <SectionTitle>
          Sous-couverts · {insureds.length}/{MAX_INSUREDS}
        </SectionTitle>
        <Card style={{ paddingVertical: 4 }}>
          {insureds.length ? (
            insureds.map((p, i) => (
              <Person key={p.id} p={p} first={i === 0} sub={`${p.lien} · ${ageFrom(p.birthday)} ans · code ${p.code}`} />
            ))
          ) : (
            <Text style={[st.sub, { paddingVertical: 14 }]}>Aucun sous-couvert.</Text>
          )}
        </Card>
        <Text style={st.hint}>
          Chaque sous-couvert ajoute {new Intl.NumberFormat('fr-FR').format(price)} FCFA à la cotisation mensuelle.
        </Text>

        <SectionTitle>Ayants-droit</SectionTitle>
        <Card style={{ paddingVertical: 4 }}>
          {beneficiaries.map((p, i) => (
            <Person key={p.id} p={p} first={i === 0} sub={`${p.lien} · ${formatPhone(p.phone)}`} />
          ))}
        </Card>

        <Card style={{ flexDirection: 'row', gap: 12, backgroundColor: C.orSoft, borderColor: '#EAD7AE' }}>
          <Ionicons name="finger-print-outline" size={22} color={C.iroko} />
          <Text style={{ flex: 1, color: C.iroko, fontSize: 13, lineHeight: 19 }}>
            Pour ajouter un proche, rendez-vous à l’agence MAAD. Une personne ne peut être inscrite qu’une seule fois à la
            mutuelle : si elle est déjà couverte par un autre adhérent, l’inscription sera refusée.
          </Text>
        </Card>
      </Screen>
    </>
  )
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  name: { fontSize: 15, fontWeight: '700', color: C.ebene },
  sub: { fontSize: 12, color: C.muted, marginTop: 3 },
  hint: { fontSize: 12, color: C.muted, marginTop: -6, paddingHorizontal: 4 },
})
