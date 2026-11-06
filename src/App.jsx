import { BrowserRouter, Outlet, Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthProvider'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { RotaProtegida } from './components/RotaProtegida'
import { Inicio } from './pages/Inicio'
import { MapaPublico } from './pages/MapaPublico'
import { Cartazes } from './pages/Cartazes'
import { PerdidoDetalhe } from './pages/PerdidoDetalhe'
import { Entrar } from './pages/Entrar'
import { Cadastrar } from './pages/Cadastrar'
import { OcorrenciaDetalhe } from './pages/OcorrenciaDetalhe'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { TutorPainel } from './pages/tutor/TutorPainel'
import { TutorPetForm } from './pages/tutor/TutorPetForm'
import { TutorPerdidos } from './pages/tutor/TutorPerdidos'
import { TutorPerdidoDetalhe } from './pages/tutor/TutorPerdidoDetalhe'
import { OngPainel } from './pages/ong/OngPainel'
import { OngCadastro } from './pages/ong/OngCadastro'
import { CoordDispositivos } from './pages/coordenacao/CoordDispositivos'
import { CoordSimulador } from './pages/coordenacao/CoordSimulador'
import { CoordOcorrencias } from './pages/coordenacao/CoordOcorrencias'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

/** Agrupa rotas que exigem um papel. */
function Area({ papel }) {
  return (
    <RotaProtegida papel={papel}>
      <Outlet />
    </RotaProtegida>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="mapa" element={<MapaPublico />} />
            <Route path="cartazes" element={<Cartazes />} />
            <Route path="perdidos/:id" element={<PerdidoDetalhe />} />
            <Route path="entrar" element={<Entrar />} />
            <Route path="cadastrar" element={<Cadastrar />} />

            <Route path="tutor" element={<Area papel="tutor" />}>
              <Route index element={<TutorPainel />} />
              <Route path="pets/novo" element={<TutorPetForm />} />
              <Route path="pets/:id" element={<TutorPetForm />} />
              <Route path="perdidos" element={<TutorPerdidos />} />
              <Route path="perdidos/:id" element={<TutorPerdidoDetalhe />} />
            </Route>

            <Route path="ong" element={<Area papel="ong" />}>
              <Route index element={<OngPainel />} />
              <Route path="ocorrencias/:id" element={<OcorrenciaDetalhe />} />
              <Route path="cadastro" element={<OngCadastro />} />
            </Route>

            <Route path="coordenacao" element={<Area papel="coordenacao" />}>
              <Route index element={<CoordDispositivos />} />
              <Route path="simulador" element={<CoordSimulador />} />
              <Route path="ocorrencias" element={<CoordOcorrencias />} />
              <Route path="ocorrencias/:id" element={<OcorrenciaDetalhe />} />
            </Route>

            <Route path="*" element={<NaoEncontrada />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
