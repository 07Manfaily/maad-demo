import Ionicons from '@expo/vector-icons/Ionicons'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StoolMark } from './src/components/Logo'
import { StoreProvider, useStore } from './src/data/store'
import ContributionsScreen from './src/screens/ContributionsScreen'
import FamilyScreen from './src/screens/FamilyScreen'
import HistoryScreen from './src/screens/HistoryScreen'
import HomeScreen from './src/screens/HomeScreen'
import LoginScreen from './src/screens/LoginScreen'
import PayScreen from './src/screens/PayScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import ReceiptScreen from './src/screens/ReceiptScreen'
import { C } from './src/theme'

const TABS = [
  { id: 'home', label: 'Accueil', icon: 'home', Screen: HomeScreen },
  { id: 'contributions', label: 'Cotisations', icon: 'calendar', Screen: ContributionsScreen },
  { id: 'history', label: 'Paiements', icon: 'receipt', Screen: HistoryScreen },
  { id: 'family', label: 'Famille', icon: 'people', Screen: FamilyScreen },
  { id: 'profile', label: 'Profil', icon: 'person', Screen: ProfileScreen },
]
const STACK = { pay: PayScreen, receipt: ReceiptScreen }

// Navigation volontairement simple (onglets + pile d'écrans) : aucune route
// d'URL, donc la version web fonctionne telle quelle sur GitHub Pages.
function Main() {
  const store = useStore()
  const insets = useSafeAreaInsets()
  const [tab, setTabState] = useState('home')
  const [stack, setStack] = useState([])

  const setTab = useCallback((t) => {
    setStack([])
    setTabState(t)
  }, [])
  const nav = {
    setTab,
    push: (name, params) => setStack((s) => [...s, { name, params, key: Date.now() }]),
    back: () => setStack((s) => s.slice(0, -1)),
    reset: (t) => setTab(t),
  }

  if (!store) {
    return (
      <View style={[styles.fill, { alignItems: 'center', justifyContent: 'center', backgroundColor: C.ebene }]}>
        <ActivityIndicator color={C.or} />
      </View>
    )
  }
  if (!store.view) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen />
      </>
    )
  }

  const top = stack[stack.length - 1]
  const Current = top ? STACK[top.name] : TABS.find((t) => t.id === tab).Screen
  const darkTop = !top && tab === 'home'

  return (
    <View style={styles.fill}>
      <StatusBar style={darkTop ? 'light' : 'dark'} />
      <View style={[styles.fill, { paddingTop: darkTop ? 0 : insets.top, backgroundColor: darkTop ? C.ebene : C.bg }]}>
        <Current key={top ? top.key : tab} nav={nav} params={top?.params} />
      </View>
      {!top && (
        <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TABS.map((t) => {
            const on = t.id === tab
            return (
              <Pressable key={t.id} style={styles.tab} onPress={() => setTab(t.id)} accessibilityRole="tab">
                <View style={[styles.tabIcon, on && { backgroundColor: C.orSoft }]}>
                  <Ionicons name={on ? t.icon : `${t.icon}-outline`} size={21} color={on ? C.iroko : C.muted} />
                </View>
                <Text style={[styles.tabLabel, on && { color: C.iroko, fontWeight: '800' }]}>{t.label}</Text>
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}

// Sur un écran large (ordinateur), la version web s'affiche dans un cadre de
// téléphone pour ressembler à l'appli ; sur mobile elle occupe tout l'écran.
function WebFrame({ children }) {
  const { width, height } = useWindowDimensions()
  if (Platform.OS !== 'web' || width < 700) return children
  const h = Math.min(860, height - 48)
  return (
    <View style={styles.desk}>
      <View style={styles.deskText}>
        <View style={styles.deskLogo}>
          <StoolMark size={54} />
        </View>
        <Text style={styles.deskTitle}>MAAD mobile</Text>
        <Text style={styles.deskLead}>
          L’appli des adhérents : payer sa cotisation par Wave, Orange Money, MTN MoMo ou Moov Money, et suivre sa couverture.
        </Text>
        <Text style={styles.deskNote}>
          Appli Android (React Native) · version web identique pour iPhone, à ouvrir dans Safari puis « Ajouter à l’écran
          d’accueil ». Démo : données fictives, paiements simulés.
        </Text>
      </View>
      <View style={[styles.phone, { height: h, width: Math.round(h * 0.48) }]}>
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <WebFrame>
          <Main />
        </WebFrame>
      </StoreProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tabbar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999 },
  tabLabel: { fontSize: 11, color: C.muted, fontWeight: '600' },
  desk: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 64,
    backgroundColor: C.ebene,
    padding: 24,
  },
  deskText: { maxWidth: 360 },
  deskLogo: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: C.kaolin,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  deskTitle: { color: C.kaolin, fontSize: 40, fontWeight: '900', letterSpacing: 1 },
  deskLead: { color: '#CDBFAE', fontSize: 17, lineHeight: 26, marginTop: 12 },
  deskNote: { color: C.orLight, fontSize: 13, lineHeight: 20, marginTop: 18 },
  phone: {
    borderRadius: 46,
    padding: 12,
    backgroundColor: '#0C0A08',
    borderWidth: 2,
    borderColor: '#3A2F26',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
  screen: { flex: 1, borderRadius: 36, overflow: 'hidden', backgroundColor: C.bg },
})
