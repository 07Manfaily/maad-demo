// Logo MAAD (tabouret baoulé), même dessin que le back-office, en react-native-svg.
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg'
import { C } from '../theme'

const CHECKER = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1],
  [0, 1, 0],
]

export function StoolMark({ size = 40 }) {
  return (
    <Svg width={size} height={(size * 110) / 120} viewBox="0 0 120 110">
      <Defs>
        <LinearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.irokoLight} />
          <Stop offset="1" stopColor={C.iroko} />
        </LinearGradient>
      </Defs>
      <Rect x="38" y="44" width="44" height="54" fill={C.ebene} />
      <Rect x="41" y="46" width="3.5" height="50" rx="1.5" fill={C.kaolin} />
      <Rect x="75.5" y="46" width="3.5" height="50" rx="1.5" fill={C.kaolin} />
      <Rect x="47" y="46" width="26" height="52" rx="2" fill={C.or} />
      {CHECKER.flatMap((row, r) =>
        row.map((on, c) =>
          on ? (
            <Rect key={`${r}-${c}`} x={49.5 + c * 7.5} y={52 + r * 10} width="6" height="7" rx="1" fill={C.ebene} />
          ) : null,
        ),
      )}
      <Path
        d="M27 44 H39 V98 H27 V92 L21 88.5 L27 85 V79 L21 75.5 L27 72 V66 L21 62.5 L27 59 V53 L21 49.5 L27 46 Z"
        fill={C.iroko}
      />
      <Path
        d="M93 44 H81 V98 H93 V92 L99 88.5 L93 85 V79 L99 75.5 L93 72 V66 L99 62.5 L93 59 V53 L99 49.5 L93 46 Z"
        fill={C.iroko}
      />
      <Path d="M16 96 H104 L106 104 Q60 109 14 104 Z" fill="url(#wood)" />
      <Path
        d="M3 20 C8 17 13 21 15 26 Q60 50 105 26 C107 21 112 17 117 20 C120 29 115 38 106 40 Q60 62 14 40 C5 38 0 29 3 20 Z"
        fill="url(#wood)"
      />
      <Path
        d="M16 30 Q60 52 104 30"
        fill="none"
        stroke={C.orLight}
        strokeOpacity={0.45}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  )
}

// Bande de motifs en damier or / ébène (rappel des pagnes et du tabouret).
export function Motif({ height = 8, color = C.or, opacity = 1 }) {
  const n = 40
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${n * 2} 2`} preserveAspectRatio="none" opacity={opacity}>
      {Array.from({ length: n }, (_, i) => (
        <Rect key={i} x={i * 2} y={i % 2} width="1" height="1" fill={color} />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <Rect key={`b${i}`} x={i * 2 + 1} y={(i + 1) % 2} width="1" height="1" fill={color} />
      ))}
    </Svg>
  )
}
