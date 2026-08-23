import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RoomProvider } from './context/RoomContext'
import { PartyProvider } from './context/PartyContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Players } from './pages/Players'
import { Games } from './pages/Games'
import { PlayGame } from './pages/PlayGame'
import { Stats } from './pages/Stats'
import { RandomGame } from './pages/RandomGame'
import { Salon } from './pages/Salon'

export default function App() {
  return (
    <RoomProvider>
      <PartyProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="joueurs" element={<Players />} />
              <Route path="jeux" element={<Games />} />
              <Route path="jeu/:id" element={<PlayGame />} />
              <Route path="stats" element={<Stats />} />
              <Route path="aleatoire" element={<RandomGame />} />
              <Route path="salon" element={<Salon />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PartyProvider>
    </RoomProvider>
  )
}
