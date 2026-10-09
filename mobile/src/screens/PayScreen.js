// Parcours de paiement Mobile Money, entièrement simulé :
// mois à régler → opérateur et numéro → récapitulatif → validation → reçu.
import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button, Card, Header, InfoRow, OperatorBadge, Screen } from '../components/ui'
import { useStore } from '../data/store'
import { fcfa, formatPeriod, formatPhone } from '../lib/format'
import { C, OPERATORS } from '../theme'
import { ReceiptCard } from './ReceiptScreen'

const STEPS = ['months', 'operator', 'confirm']

export default function PayScreen({ nav, params = {} }) {
  const { view, pay } = useStore()
  const { member, rows, advance, unpaid } = view
  const [step, setStep] = useState('months')
  const [selected, setSelected] = useState(() =>
    params.periods || (unpaid.length ? unpaid.map((r) => r.period) : advance.filter((r) => r.solde > 0).slice(0, 1).map((r) => r.period)),
  )
  const [operator, setOperator] = useState(params.operator || null)
  const [phone, setPhone] = useState(member.phone)
  const [pin, setPin] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [phase, setPhase] = useState('waiting') // waiting → processing

  const choices = useMemo(
    () => [...[...rows].reverse().filter((r) => r.solde > 0), ...advance.filter((r) => r.solde > 0).map((r) => ({ ...r, future: true }))],
    [rows, advance],
  )
  const total = choices.filter((r) => selected.includes(r.period)).reduce((s, r) => s + r.solde, 0)
  const op = OPERATORS.find((o) => o.id === operator)
  const phoneOk = /^\d{10}$/.test(phone)
  const prefixWarning = op?.prefix && phoneOk && !phone.startsWith(op.prefix)

  const toggle = (p) => setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]))
  const back = () => {
    const i = STEPS.indexOf(step)
    if (i > 0) setStep(STEPS[i - 1])
    else if (step === 'validate') setStep('confirm')
    else nav.back()
  }

  const confirmPayment = () => {
    setPhase('processing')
    setTimeout(() => {
      const r = pay({ periods: selected, operator, phone })
      setReceipt(r)
      setStep('done')
    }, 1800)
  }

  // Wave : la confirmation arrive « toute seule » depuis l'appli Wave (simulée).
  useEffect(() => {
    if (step !== 'validate') setPhase('waiting')
  }, [step])

  if (step === 'done' && receipt) {
    return (
      <>
        <Header title="Paiement réussi" subtitle="Votre cotisation est enregistrée" />
        <Screen contentStyle={{ paddingTop: 4 }}>
          <ReceiptCard p={receipt} member={member} />
          <Button title="Retour à l’accueil" icon="home-outline" onPress={() => nav.reset('home')} />
          <Button title="Voir mes cotisations" variant="ghost" onPress={() => nav.reset('contributions')} />
        </Screen>
      </>
    )
  }

  const titles = {
    months: ['Payer ma cotisation', 'Étape 1 sur 3 · mois à régler'],
    operator: ['Moyen de paiement', 'Étape 2 sur 3 · Mobile Money'],
    confirm: ['Récapitulatif', 'Étape 3 sur 3 · vérifiez avant de payer'],
    validate: ['Validation', op ? op.name : ''],
  }

  return (
    <>
      <Header title={titles[step][0]} subtitle={titles[step][1]} onBack={phase === 'processing' ? null : back} />
      <Steps step={step} />
      <Screen contentStyle={{ paddingTop: 8 }}>
        {step === 'months' && (
          <>
            {choices.map((r) => {
              const on = selected.includes(r.period)
              return (
                <Pressable key={r.period} onPress={() => toggle(r.period)}>
                  <Card style={[st.choice, on && st.choiceOn]}>
                    <View style={[st.checkbox, on && { backgroundColor: C.iroko, borderColor: C.iroko }]}>
                      {on ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.choiceTitle}>{formatPeriod(r.period)}</Text>
                      <Text style={st.choiceSub}>
                        {r.future ? 'Paiement d’avance' : r.pay > 0 ? `Partiel · déjà versé ${fcfa(r.pay)}` : 'Impayé'}
                      </Text>
                    </View>
                    <Text style={st.choiceAmount}>{fcfa(r.solde)}</Text>
                  </Card>
                </Pressable>
              )
            })}
            <TotalBar total={total} label={`${selected.length} mois sélectionné${selected.length > 1 ? 's' : ''}`} />
            <Button title="Continuer" icon="arrow-forward" disabled={!selected.length} onPress={() => setStep('operator')} />
          </>
        )}

        {step === 'operator' && (
          <>
            {OPERATORS.map((o) => {
              const on = operator === o.id
              return (
                <Pressable key={o.id} onPress={() => setOperator(o.id)}>
                  <Card style={[st.choice, on && { borderColor: o.color, borderWidth: 2 }]}>
                    <OperatorBadge id={o.id} size={46} />
                    <View style={{ flex: 1 }}>
                      <Text style={st.choiceTitle}>{o.name}</Text>
                      <Text style={st.choiceSub}>{o.hint}</Text>
                    </View>
                    <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? C.iroko : C.line} />
                  </Card>
                </Pressable>
              )
            })}
            <Card>
              <Text style={st.label}>Numéro {op ? op.name : 'Mobile Money'} à débiter</Text>
              <TextInput
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                style={st.input}
                placeholder="07 00 00 00 00"
                placeholderTextColor={C.muted}
              />
              {!phoneOk ? <Text style={st.warn}>Le numéro doit contenir 10 chiffres.</Text> : null}
              {prefixWarning ? (
                <Text style={st.warn}>
                  Les numéros {op.name} commencent en général par {op.prefix}. Vérifiez le numéro.
                </Text>
              ) : null}
            </Card>
            <TotalBar total={total} label="À payer" />
            <Button title="Continuer" icon="arrow-forward" disabled={!op || !phoneOk} onPress={() => setStep('confirm')} />
          </>
        )}

        {step === 'confirm' && op && (
          <>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <OperatorBadge id={op.id} size={44} />
                <View>
                  <Text style={st.choiceTitle}>{op.name}</Text>
                  <Text style={st.choiceSub}>{formatPhone(phone)}</Text>
                </View>
              </View>
              <InfoRow label="Adhérent" value={`${member.name} · N° ${member.number}`} />
              {choices
                .filter((r) => selected.includes(r.period))
                .map((r) => (
                  <InfoRow key={r.period} label={formatPeriod(r.period)} value={fcfa(r.solde)} />
                ))}
              <InfoRow label="Frais" value="0 FCFA" />
              <InfoRow label="Total à débiter" value={fcfa(total)} strong />
            </Card>
            <View style={st.notice}>
              <Ionicons name="shield-checkmark-outline" size={18} color={C.indigo} />
              <Text style={st.noticeText}>
                Démo : aucun argent n’est débité. En production, la demande partira vers {op.name} via l’agrégateur de
                paiement choisi par la mutuelle.
              </Text>
            </View>
            <Button title={`Payer ${fcfa(total)}`} icon="lock-closed-outline" onPress={() => setStep('validate')} />
          </>
        )}

        {step === 'validate' && op && (
          <>
            <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
              <OperatorBadge id={op.id} size={64} />
              <Text style={[st.choiceTitle, { marginTop: 14, fontSize: 18 }]}>{fcfa(total)}</Text>
              <Text style={[st.choiceSub, { textAlign: 'center', marginTop: 6 }]}>
                Demande envoyée au {formatPhone(phone)}
              </Text>
              {phase === 'processing' ? (
                <View style={{ alignItems: 'center', marginTop: 22, gap: 10 }}>
                  <ActivityIndicator size="large" color={C.iroko} />
                  <Text style={st.choiceSub}>Confirmation par {op.name} en cours…</Text>
                </View>
              ) : op.usesPin ? (
                <View style={{ alignSelf: 'stretch', marginTop: 18 }}>
                  <View style={[st.ussd, { borderColor: op.color }]}>
                    <Text style={st.ussdTitle}>{op.name}</Text>
                    <Text style={st.ussdText}>
                      Payer {fcfa(total)} à MAAD MUTUELLE ? Saisissez votre code secret pour confirmer.
                    </Text>
                    <TextInput
                      value={pin}
                      onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                      keyboardType="number-pad"
                      secureTextEntry
                      style={[st.input, { textAlign: 'center', letterSpacing: 10 }]}
                      placeholder="••••"
                      placeholderTextColor={C.muted}
                    />
                    <Text style={[st.choiceSub, { textAlign: 'center', marginTop: 6 }]}>Démo : n’importe quel code à 4 chiffres</Text>
                  </View>
                  <Button title="Valider" onPress={confirmPayment} disabled={pin.length !== 4} style={{ marginTop: 14 }} />
                </View>
              ) : (
                <View style={{ alignSelf: 'stretch', marginTop: 18, gap: 12 }}>
                  <Text style={[st.choiceSub, { textAlign: 'center' }]}>
                    Ouvrez l’application Wave sur votre téléphone et confirmez le paiement.
                  </Text>
                  <Button title="Simuler la confirmation Wave" onPress={confirmPayment} />
                </View>
              )}
            </Card>
            {phase !== 'processing' ? <Button title="Annuler" variant="ghost" onPress={back} /> : null}
          </>
        )}
      </Screen>
    </>
  )
}

function Steps({ step }) {
  const i = step === 'validate' ? 3 : STEPS.indexOf(step)
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingBottom: 6, backgroundColor: C.bg }}>
      {STEPS.map((s, k) => (
        <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: k <= i ? C.or : C.line }} />
      ))}
    </View>
  )
}

function TotalBar({ total, label }) {
  return (
    <View style={st.total}>
      <Text style={{ color: '#CDBFAE', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: C.orLight, fontSize: 22, fontWeight: '900' }}>{fcfa(total)}</Text>
    </View>
  )
}

const st = StyleSheet.create({
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  choiceOn: { borderColor: C.iroko, backgroundColor: '#FFF8EC' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTitle: { fontSize: 15, fontWeight: '700', color: C.ebene },
  choiceSub: { fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 17 },
  choiceAmount: { fontSize: 15, fontWeight: '800', color: C.ebene },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.ebene,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: { fontSize: 13, fontWeight: '700', color: C.muted, marginBottom: 8 },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: C.ebene,
    letterSpacing: 1,
  },
  warn: { color: C.terre, fontSize: 12, marginTop: 8 },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: C.indigoSoft, borderRadius: 14, padding: 12 },
  noticeText: { flex: 1, color: C.indigo, fontSize: 12, lineHeight: 18 },
  ussd: { borderWidth: 2, borderRadius: 16, padding: 14, backgroundColor: '#fff' },
  ussdTitle: { fontWeight: '800', color: C.ebene, textAlign: 'center' },
  ussdText: { color: C.ebene, fontSize: 13, textAlign: 'center', marginVertical: 10, lineHeight: 19 },
})
