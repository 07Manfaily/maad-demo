// Logo MAAD : le tabouret baoulé (siège du chef, symbole d'autorité et de
// solidarité) stylisé. Assise incurvée en bois d'iroko, colonne centrale
// ajourée en damier or/ébène, montants crantés et bandes de kaolin.

export const COLORS = {
  iroko: '#6B3F1F',
  irokoLight: '#9A6236',
  or: '#C9962B',
  orLight: '#E2B85A',
  ebene: '#1B1612',
  kaolin: '#F5EFE4',
  indigo: '#1F3A5F',
}

const CHECKER = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1],
  [0, 1, 0],
]

// Le tabouret seul, dans un repère 120 x 110.
export function StoolMark({ size = 40, mono = false, title = 'MAAD', ...rest }) {
  const wood = mono ? 'currentColor' : 'url(#maad-wood)'
  const post = mono ? 'currentColor' : COLORS.iroko
  const gold = mono ? 'currentColor' : COLORS.or
  const dark = mono ? 'transparent' : COLORS.ebene
  const light = mono ? 'transparent' : COLORS.kaolin
  return (
    <svg
      width={size}
      height={(size * 110) / 120}
      viewBox="0 0 120 110"
      role="img"
      aria-label={title}
      {...rest}
    >
      <defs>
        <linearGradient id="maad-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.irokoLight} />
          <stop offset="1" stopColor={COLORS.iroko} />
        </linearGradient>
      </defs>
      {/* fond de la partie ajourée */}
      <rect x="38" y="44" width="44" height="54" fill={dark} />
      {/* bandes de kaolin */}
      <rect x="41" y="46" width="3.5" height="50" rx="1.5" fill={light} />
      <rect x="75.5" y="46" width="3.5" height="50" rx="1.5" fill={light} />
      {/* colonne centrale en damier */}
      <rect x="47" y="46" width="26" height="52" rx="2" fill={gold} />
      {CHECKER.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={49.5 + c * 7.5}
              y={52 + r * 10}
              width="6"
              height="7"
              rx="1"
              fill={mono ? 'var(--maad-mono-bg, #fff)' : COLORS.ebene}
            />
          ) : null,
        ),
      )}
      {/* montants crantés */}
      <path
        d="M27 44 H39 V98 H27 V92 L21 88.5 L27 85 V79 L21 75.5 L27 72 V66 L21 62.5 L27 59 V53 L21 49.5 L27 46 Z"
        fill={post}
      />
      <path
        d="M93 44 H81 V98 H93 V92 L99 88.5 L93 85 V79 L99 75.5 L93 72 V66 L99 62.5 L93 59 V53 L99 49.5 L93 46 Z"
        fill={post}
      />
      {/* socle */}
      <path d="M16 96 H104 L106 104 Q60 109 14 104 Z" fill={wood} />
      {/* assise incurvée aux extrémités relevées */}
      <path
        d="M3 20 C8 17 13 21 15 26 Q60 50 105 26 C107 21 112 17 117 20 C120 29 115 38 106 40 Q60 62 14 40 C5 38 0 29 3 20 Z"
        fill={wood}
      />
      {/* reflet sur l'assise */}
      {!mono && (
        <path
          d="M16 30 Q60 52 104 30"
          fill="none"
          stroke={COLORS.orLight}
          strokeOpacity=".45"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

// Logo complet : texte en arc au-dessus du sigle et du tabouret.
export function FullLogo({ width = 320, dark = false }) {
  const ink = dark ? COLORS.kaolin : COLORS.ebene
  return (
    <svg width={width} viewBox="0 0 360 330" role="img" aria-label="MAAD, Mutuelle d'Assistance d'Adzopé">
      <defs>
        <path id="maad-arc" d="M34 168 A146 128 0 0 1 326 168" />
      </defs>
      <text
        fill={ink}
        fontFamily="'Plus Jakarta Sans', 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize="17"
        letterSpacing="2.4"
      >
        <textPath href="#maad-arc" startOffset="50%" textAnchor="middle">
          MUTUELLE D’ASSISTANCE D’ADZOPÉ
        </textPath>
      </text>
      <text
        x="180"
        y="140"
        textAnchor="middle"
        fill={ink}
        fontFamily="'Fraunces', Georgia, serif"
        fontWeight="800"
        fontSize="62"
        letterSpacing="4"
      >
        MAAD
      </text>
      <g transform="translate(90 150) scale(1.5)">
        <StoolMark size={120} />
      </g>
    </svg>
  )
}

// Logo horizontal pour la barre latérale.
export function LogoLockup({ dark = true, compact = false }) {
  return (
    <div className={`lockup ${dark ? 'lockup--dark' : ''}`}>
      <StoolMark size={compact ? 34 : 44} />
      {!compact && (
        <div className="lockup__text">
          <strong>MAAD</strong>
          <span>Mutuelle d’Assistance d’Adzopé</span>
        </div>
      )}
    </div>
  )
}
