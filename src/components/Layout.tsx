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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#07020f] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07020f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <img
                src="/images/logo-icon.jpg"
                alt="Soirée"
                className="h-8 w-8 shrink-0 rounded-xl object-cover ring-1 ring-fuchsia-400/40 sm:h-9 sm:w-9"
              />
              <div className="min-w-0">
                <p className="font-display text-base leading-none tracking-wide text-white sm:text-lg">SOIRÉE</p>
                <p className="hidden text-[10px] uppercase tracking-[0.18em] text-fuchsia-300/80 sm:block">Jeux d’alcool</p>
              </div>
            </Link>
            <OwnerZip compact />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <Users className="h-3.5 w-3.5 text-fuchsia-300" />
              {allPlayers.length}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-y-auto overscroll-contain px-3 pb-24 pt-4 sm:px-4">
        <TableSync />
        <Outlet />
        <div className="mt-8 flex justify-center pb-2">
          <OwnerZip />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0b0418]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <WaterGlass id="nav-bottom-left" size="sm" className="pointer-events-none absolute left-0.5 top-0.5 scale-75 opacity-25" />
        <div className="mx-auto grid max-w-5xl grid-cols-4 px-1 py-1">
          {NAV.map((item) => {
            const active =
              item.to === '/'
                ? pathname === '/'
                : pathname === item.to
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] leading-none transition ${
                  active ? 'text-fuchsia-300' : 'text-white/55 hover:text-white/80'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'drop-shadow-[0_0_8px_rgba(240,171,252,0.8)]' : ''}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}