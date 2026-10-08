import { FullLogo, StoolMark } from '../components/Logo'
import { PageHeader } from '../components/ui'

const PALETTE = [
  { name: 'Ébène', hex: '#1B1612', role: 'Textes, barre latérale', story: 'Le bois sombre des masques et statuettes baoulé.' },
  { name: 'Iroko', hex: '#6B3F1F', role: 'Couleur de marque', story: 'Le bois sculpté du tabouret, siège de l’autorité et de la lignée.' },
  { name: 'Or baoulé', hex: '#C9962B', role: 'Accent, boutons principaux', story: 'L’or des poids à peser et des parures royales.' },
  { name: 'Terre rouge', hex: '#B5532A', role: 'Alertes, impayés', story: 'La latérite des villages et les pigments d’ocre.' },
  { name: 'Indigo', hex: '#1F3A5F', role: 'Informations, graphiques', story: 'Les pagnes tissés teints à l’indigo.' },
  { name: 'Vert raphia', hex: '#4E7A3A', role: 'Succès, « à jour »', story: 'Les fibres de raphia et la forêt de l’Agnéby.' },
  { name: 'Kaolin', hex: '#F5EFE4', role: 'Fonds clairs', story: 'L’argile blanche des rites et des masques Goli.' },
]

export default function Identity() {
  return (
    <>
      <PageHeader
        eyebrow="Proposition"
        title="Identité visuelle"
        subtitle="Logo et palette inspirés du tabouret et de l’art baoulé, à valider avec la mutuelle."
      />
      <div className="grid-2 grid-2--top">
        <section className="card identity-logo">
          <FullLogo width={320} />
          <p className="muted">
            Le tabouret baoulé est le siège du chef et le symbole de l’unité de la famille. L’assise incurvée, les montants
            crantés, les bandes de kaolin et la colonne ajourée en damier reprennent l’image fournie.
          </p>
        </section>
        <section className="card identity-dark">
          <FullLogo width={320} dark />
          <div className="identity-marks">
            <StoolMark size={72} />
            <StoolMark size={48} />
            <StoolMark size={28} />
          </div>
        </section>
      </div>
      <section className="card">
        <div className="card__head">
          <h3>Palette proposée</h3>
        </div>
        <div className="swatches">
          {PALETTE.map((c) => (
            <div key={c.hex} className="swatch">
              <div className="swatch__color" style={{ background: c.hex }} />
              <strong>{c.name}</strong>
              <code>{c.hex}</code>
              <span className="swatch__role">{c.role}</span>
              <p className="muted">{c.story}</p>
            </div>
          ))}
        </div>
        <div className="type-sample">
          <div>
            <span className="eyebrow">Titres</span>
            <p className="display">Fraunces</p>
          </div>
          <div>
            <span className="eyebrow">Texte</span>
            <p className="body-sample">Plus Jakarta Sans, lisible sur ordinateur comme sur mobile.</p>
          </div>
        </div>
      </section>
    </>
  )
}
