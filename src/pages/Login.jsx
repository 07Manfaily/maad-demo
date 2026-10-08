import { useState } from 'react'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { useStore } from '../data/store'
import { FullLogo } from '../components/Logo'

export default function Login() {
  const { login } = useStore()
  const [email, setEmail] = useState('admin@maad.ci')
  const [pwd, setPwd] = useState('demo2026')

  return (
    <div className="login">
      <section className="login__art">
        <div className="login__pattern" />
        <div className="login__logo">
          <FullLogo width={340} dark />
        </div>
        <blockquote>
          « Le tabouret porte le chef, la mutuelle porte la famille. »
          <span>Solidarité, entraide et protection pour les familles d’Adzopé.</span>
        </blockquote>
      </section>
      <section className="login__form">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            login()
          }}
        >
          <p className="eyebrow">Espace de gestion</p>
          <h1>Bon retour parmi nous</h1>
          <p className="muted">Connectez-vous pour gérer les adhérents, les sous-couverts et les cotisations.</p>
          <label className="field">
            <span className="field__label">Adresse e-mail</span>
            <div className="input-icon">
              <Mail size={16} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
          </label>
          <label className="field">
            <span className="field__label">Mot de passe</span>
            <div className="input-icon">
              <Lock size={16} />
              <input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" />
            </div>
          </label>
          <div className="login__row">
            <label className="check">
              <input type="checkbox" defaultChecked /> Se souvenir de moi
            </label>
            <a href="#/" onClick={(e) => e.preventDefault()}>
              Mot de passe oublié ?
            </a>
          </div>
          <button className="btn btn--primary btn--lg btn--block">
            Se connecter <ArrowRight size={18} />
          </button>
          <p className="login__demo">Démo : les identifiants sont déjà remplis, cliquez simplement sur « Se connecter ».</p>
        </form>
      </section>
    </div>
  )
}
