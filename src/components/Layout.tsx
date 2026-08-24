import { Link, Outlet, useLocation } from 'react-router-dom'
import { GlassWater, House, Trophy, Users } from 'lucide-react'
import { useParty } from '../context/PartyContext'
import { WaterGlass } from './WaterGlass'
import { OwnerZip } from './OwnerZip'
import { RoomBar } from './RoomBar'
import { PlayNowBar } from './PlayNowBar'
import { TableSync } from './TableSync'

const NAV = [
  { to: '/', icon: House, label: 'Accueil' },
  { to: '/joueurs', icon: Users, label: 'Joueurs' },
  { to: '/jeux', icon: GlassWater, label: 'Jeux' },
  { to: '/stats', icon: Trophy, label: 'Stats' },
]

export function Layout() {
  const { pathname } = useLocation()
  const { allPlayers, waterCount } = useParty()

  return (
    <div className="flex min-h-dvh flex-col bg-[#07020f] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07020f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/images/logo-icon.jpg"
                alt="Soirée"
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-fuchsia-400/40"
              />
              <div>
                <p className="font-display text-lg leading-none tracking-wide text-white">SOIRÉE</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-fuchsia-300/80">Jeux d’alcool</p>
              </div>
            </Link>
            <OwnerZip compact />
          </div>
          <div className="flex items-center gap-2">
            <PlayNowBar />
            <RoomBar />
            <WaterGlass id="nav-header" size="sm" />
            <Link
              to="/stats"
              className="hidden items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[11px] text-sky-200 sm:inline-flex"
              title="Verres d’eau trouvés"
            >
              💧 {waterCount}
            </Link>
            <Link
              to="/joueurs"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              <Users className="h-3.5 w-3.5 text-fuchsia-300" />
              {allPlayers.length} joueur{allPlayers.length > 1 ? 's' : ''}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-4">
        <TableSync />
        <Outlet />
        <div className="mt-8 flex justify-center pb-2">
          <OwnerZip />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0418]/90 backdrop-blur-xl">
        <WaterGlass id="nav-bottom-left" size="sm" className="absolute left-0.5 top-0.5 scale-75 opacity-25" />
        <div className="mx-auto grid max-w-5xl grid-cols-4 px-1 py-0.5">
          {NAV.map((item) => {
            const active =
              item.to === '/'
                ? pathname === '/'
                : item.to === '/jeux'
                  ? pathname === '/jeux' || pathname.startsWith('/jeu/')
                  : pathname === item.to || pathname.startsWith(`${item.to}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0 rounded-lg px-1 py-1 text-[9px] leading-none transition ${
                  active ? 'text-fuchsia-300' : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'drop-shadow-[0_0_8px_rgba(240,171,252,0.8)]' : ''}`} />
                <span className="mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}