import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from './data/store'
import { ToastProvider } from './components/ui'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import MemberDetail from './pages/MemberDetail'
import Insureds from './pages/Insureds'
import Beneficiaries from './pages/Beneficiaries'
import Contributions from './pages/Contributions'
import Duplicates from './pages/Duplicates'
import Profile from './pages/Profile'
import Radiations from './pages/Radiations'

function Guarded() {
  const { authed } = useStore()
  if (!authed) return <Login />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="adherents" element={<Members />} />
        <Route path="adherents/:id" element={<MemberDetail />} />
        <Route path="sous-couverts" element={<Insureds />} />
        <Route path="ayants-droit" element={<Beneficiaries />} />
        <Route path="cotisations" element={<Contributions />} />
        <Route path="radies" element={<Radiations />} />
        <Route path="doublons" element={<Duplicates />} />
        <Route path="profil" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

// HashRouter : la démo fonctionne sur GitHub Pages sans configuration serveur.
export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <Guarded />
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
