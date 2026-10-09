import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { C, R, operatorById, shadow } from '../theme'

export function Screen({ children, contentStyle }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={[{ padding: 18, paddingBottom: 32, gap: 14 }, contentStyle]}>
      {children}
    </ScrollView>
  )
}

export function Header({ title, subtitle, onBack, right }) {
  return (
    <View style={s.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={s.headerBtn} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={22} color={C.ebene} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle}>{title}</Text>
        {subtitle ? <Text style={s.headerSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  )
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>
}

export function SectionTitle({ children, action, onAction }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
      <Text style={s.section}>{children}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: C.iroko, fontWeight: '700', fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, style }) {
  const v = VARIANTS[variant]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : icon ? <Ionicons name={icon} size={18} color={v.fg} /> : null}
      <Text style={[s.btnText, { color: v.fg }]}>{title}</Text>
    </Pressable>
  )
}

const VARIANTS = {
  primary: { bg: C.iroko, fg: '#fff', border: C.iroko },
  gold: { bg: C.or, fg: C.ebene, border: C.or },
  dark: { bg: C.ebene, fg: C.kaolin, border: C.ebene },
  ghost: { bg: 'transparent', fg: C.iroko, border: C.line },
}

export function StatusPill({ ok, label }) {
  return (
    <View style={[s.pill, { backgroundColor: ok ? C.vertSoft : C.terreSoft }]}>
      <View style={[s.dot, { backgroundColor: ok ? C.vert : C.terre }]} />
      <Text style={[s.pillText, { color: ok ? C.vert : C.terre }]}>{label || (ok ? 'À jour' : 'Pas à jour')}</Text>
    </View>
  )
}

export function OperatorBadge({ id, size = 40 }) {
  const op = operatorById(id)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3.2,
        backgroundColor: op.color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {op.id === 'guichet' ? (
        <Ionicons name="business" size={size * 0.48} color={op.ink} />
      ) : (
        <Text style={{ color: op.ink, fontWeight: '800', fontSize: op.short.length > 2 ? size * 0.26 : size * 0.38 }}>
          {op.short}
        </Text>
      )}
    </View>
  )
}

export function Avatar({ name, size = 44, dark }) {
  const ini = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: dark ? C.or : C.orSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: dark ? C.ebene : C.iroko, fontWeight: '800', fontSize: size * 0.36 }}>{ini}</Text>
    </View>
  )
}

export function InfoRow({ label, value, strong }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, strong && { fontWeight: '800', fontSize: 16 }]}>{value}</Text>
    </View>
  )
}

export const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: C.bg,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.ebene, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  card: {
    backgroundColor: C.surface,
    borderRadius: R,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    ...shadow,
    shadowOpacity: 0.06,
  },
  section: { flex: 1, fontSize: 13, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  btn: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, gap: 12 },
  infoLabel: { color: C.muted, fontSize: 14 },
  infoValue: { color: C.ebene, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
})
