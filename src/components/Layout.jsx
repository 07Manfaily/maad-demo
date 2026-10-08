import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  RotateCcw,
  ShieldCheck,
  UserRound,
  Users,
  Baby,
} from 'lucide-react'
import { useStore } from '../data/store'
import { LogoLockup } from './Logo'
import { Avatar, useToast } from './ui'

const NAV = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/adherents', label: 'Adhérents', icon: Users },
  { to: '/sous-couverts', label: 'Sous-couverts', icon: Baby },
  { to: '/ayants-droit', label: 'Ayants-droit', icon: HeartHandshake },
  { to: '/cotisations', label: 'Cotisations', icon: HandCoins },
  { to: '/doublons', label: 'Contrôle des doublons', icon: ShieldCheck },
]

export default function Layout() {
  const { state, logout, reset } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const loc = useLocation()

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <LogoLockup />
        </div>
        <nav className="sidebar__nav" onClick={() => setOpen(false)}>
          <span className="sidebar__section">Gestion</span>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="navlink">
              <Icon size={18} />
              <span>{label}</span>
              {to === '/doublons' && state.rejections.length > 0 && (
                <em className="navlink__count">{state.rejections.length}</em>
              )}
            </NavLink>
          ))}
          <span className="sidebar__section">Compte</span>
          <NavLink to="/profil" className="navlink">
            <UserRound size={18} />
            <span>Mon profil</span>
          </NavLink>
          <NavLink to="/identite" className="navlink">
            <Palette size={18} />
            <span>Identité visuelle</span>
          </NavLink>
        </nav>
        <div className="sidebar__foot">
          <button
            className="navlink navlink--btn"
            onClick={() => {
              reset()
              toast('Données de démonstration réinitialisées')
            }}
          >
            <RotateCcw size={16} />
            <span>Réinitialiser la démo</span>
          </button>
          <div className="sidebar__stripe" />
        </div>
      </aside>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn topbar__menu" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>
          <span className="demo-pill">Version de démonstration · données fictives</span>
          <div className="topbar__user">
            <Avatar name={state.user.name} size={34} />
            <div className="topbar__who">
              <strong>{state.user.name}</strong>
              <span>{state.user.email}</span>
            </div>
            <button className="icon-btn" onClick={logout} title="Se déconnecter" aria-label="Se déconnecter">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="content" key={loc.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
