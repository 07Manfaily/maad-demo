import { useState } from 'react'
import { KeyRound, UserRound } from 'lucide-react'
import { useStore } from '../data/store'
import { Avatar, Field, PageHeader, useToast } from '../components/ui'

export default function Profile() {
  const { state, updateUser } = useStore()
  const toast = useToast()
  const [info, setInfo] = useState(state.user)
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [err, setErr] = useState({})

  return (
    <>
      <PageHeader eyebrow="Compte" title="Mon profil" subtitle="Informations de connexion de l’agent de la mutuelle." />
      <div className="grid-2 grid-2--top">
        <section className="card">
          <div className="profile-id">
            <Avatar name={info.name} size={64} />
            <div>
              <strong>{state.user.name}</strong>
              <span className="muted">{state.user.email}</span>
            </div>
          </div>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              const er = {}
              if (!info.name.trim()) er.name = 'Le nom est obligatoire.'
              if (!/^\S+@\S+\.\S+$/.test(info.email)) er.email = 'Adresse e-mail invalide.'
              setErr(er)
              if (Object.keys(er).length) return
              updateUser(info)
              toast('Vos informations ont été mises à jour')
            }}
          >
            <h3><UserRound size={18} /> Informations</h3>
            <Field label="Nom" error={err.name}>
              <input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
            </Field>
            <Field label="Adresse e-mail" error={err.email}>
              <input value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} />
            </Field>
            <div className="form-actions">
              <button className="btn btn--primary">Enregistrer</button>
            </div>
          </form>
        </section>
        <section className="card">
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              const er = {}
              if (!pwd.current) er.current = 'Saisissez votre mot de passe actuel.'
              if (pwd.next.length < 8) er.next = 'Au moins 8 caractères.'
              else if (pwd.next !== pwd.confirm) er.confirm = 'Les deux mots de passe ne correspondent pas.'
              setErr(er)
              if (Object.keys(er).length) return
              setPwd({ current: '', next: '', confirm: '' })
              toast('Le mot de passe a été mis à jour')
            }}
          >
            <h3><KeyRound size={18} /> Mot de passe</h3>
            <Field label="Mot de passe actuel" error={err.current}>
              <input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
            </Field>
            <Field label="Nouveau mot de passe" error={err.next}>
              <input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
            </Field>
            <Field label="Confirmer" error={err.confirm}>
              <input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
            </Field>
            <div className="form-actions">
              <button className="btn btn--primary">Changer le mot de passe</button>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
