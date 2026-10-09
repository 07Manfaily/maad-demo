import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { StoolMark } from '../components/Logo'
import { Avatar, Button, Card, Header, InfoRow, Screen, StatusPill } from '../components/ui'
import { useStore } from '../data/store'
import { fcfa, formatDate, formatPhone } from '../lib/format'
import { C } from '../theme'

export default function ProfileScreen() {
  const { view, logout, reset } = useStore()
  const { member, price, upToDate } = view

  return (
    <>
      <Header title="Mon profil" />
      <Screen contentStyle={{ paddingTop: 4 }}>
        <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
          <Avatar name={member.name} size={72} dark />
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.ebene, marginTop: 12 }}>{member.name}</Text>
          <Text style={{ color: C.muted, marginTop: 4, marginBottom: 10 }}>Adhérent N° {member.number}</Text>
          <StatusPill ok={upToDate} />
        </Card>
        <Card style={{ paddingVertical: 6 }}>
          <InfoRow label="Téléphone" value={formatPhone(member.phone)} />
          <InfoRow label="Pièce d’identité" value={member.idNumber || '—'} />
          <InfoRow label="Date de naissance" value={formatDate(member.birthday)} />
          <InfoRow label="Adhérent depuis" value={formatDate(member.createdAt)} />
          <InfoRow label="Tarif par personne" value={fcfa(price)} />
        </Card>
        <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <StoolMark size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: C.ebene }}>MAAD · Mutuelle d’Assistance d’Adzopé</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
              Version de démonstration 0.1 · données fictives, paiements simulés.
            </Text>
          </View>
        </Card>
        <Button title="Réinitialiser la démo" icon="refresh-outline" variant="ghost" onPress={reset} />
        <Button title="Se déconnecter" icon="log-out-outline" variant="dark" onPress={logout} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 4 }}>
          <Ionicons name="call-outline" size={14} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: 12 }}>Besoin d’aide ? Contactez l’agence MAAD d’Adzopé.</Text>
        </View>
      </Screen>
    </>
  )
}
