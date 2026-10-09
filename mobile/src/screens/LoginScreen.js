import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Motif, StoolMark } from '../components/Logo'
import { Button } from '../components/ui'
import { DEMO_PIN, useStore } from '../data/store'
import { C } from '../theme'

export default function LoginScreen() {
  const { demoMember, login } = useStore()
  const insets = useSafeAreaInsets()
  const [number, setNumber] = useState(demoMember.number)
  const [pin, setPin] = useState(DEMO_PIN)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = () => {
    setLoading(true)
    setTimeout(() => {
      setError(login(number, pin))
      setLoading(false)
    }, 500)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.ebene }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[st.hero, { paddingTop: insets.top + 40 }]}>
          <View style={st.mark}>
            <StoolMark size={92} />
          </View>
          <Text style={st.brand}>MAAD</Text>
          <Text style={st.tagline}>Mutuelle d’Assistance d’Adzopé</Text>
          <Text style={st.lead}>Payez votre cotisation par Mobile Money et suivez votre couverture, où que vous soyez.</Text>
        </View>
        <Motif height={10} />
        <View style={[st.panel, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={st.title}>Connexion adhérent</Text>
          <Text style={st.label}>Numéro d’adhésion</Text>
          <TextInput
            value={number}
            onChangeText={(t) => setNumber(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            style={st.input}
            placeholder="Ex. 0127"
            placeholderTextColor={C.muted}
          />
          <Text style={st.label}>Code PIN</Text>
          <TextInput
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            style={st.input}
            placeholder="4 chiffres"
            placeholderTextColor={C.muted}
          />
          {error ? <Text style={st.error}>{error}</Text> : null}
          <Button title="Se connecter" icon="log-in-outline" onPress={submit} loading={loading} style={{ marginTop: 18 }} />
          <View style={st.demo}>
            <Text style={st.demoText}>
              Démo avec des données fictives. Le compte de {demoMember.name} est pré-rempli ; tout numéro d’adhésion du
              back-office fonctionne avec le code {DEMO_PIN}.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const st = StyleSheet.create({
  hero: { alignItems: 'center', paddingHorizontal: 28, paddingBottom: 30 },
  mark: {
    width: 132,
    height: 132,
    borderRadius: 40,
    backgroundColor: C.kaolin,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  brand: { color: C.kaolin, fontSize: 38, fontWeight: '900', letterSpacing: 6 },
  tagline: { color: C.orLight, fontSize: 13, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 },
  lead: { color: '#CDBFAE', fontSize: 15, textAlign: 'center', marginTop: 16, lineHeight: 22 },
  panel: { flex: 1, backgroundColor: C.bg, padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: C.ebene, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: C.muted, marginTop: 14, marginBottom: 6 },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: C.ebene,
    letterSpacing: 2,
  },
  error: { color: C.terre, marginTop: 10, fontWeight: '600' },
  demo: { marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: C.orSoft },
  demoText: { color: C.iroko, fontSize: 13, lineHeight: 19 },
})
