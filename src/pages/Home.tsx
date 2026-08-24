import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Dices, ShieldAlert, Sparkles, Users } from 'lucide-react'
import { GAMES } from '../lib/catalog'
import { useParty } from '../context/PartyContext'
import { useRoom } from '../context/RoomContext'
import { WaterGlass } from '../components/WaterGlass'

export function Home() {
  const { players, allPlayers } = useParty()
  const { connected, isHost } = useRoom()
  const hits = GAMES.slice(0, 6)

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10">
        <img src="/images/hero-party.jpg" alt="Ambiance soirée" className="h-72 w-full object-cover sm:h-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07020f] via-[#07020f]/55 to-transparent" />
        <WaterGlass id="home-hero" className="absolute right-4 top-4" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-3 py-1 text-[11px] uppercase tracking-wider text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5" />
              Multi-joueurs • Salon en ligne
            </p>
            <h1 className="font-display text-4xl leading-none sm:text-5xl">
              La soirée commence
              <span className="block text-fuchsia-300">quand le premier joue.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm text-white/75">
              {GAMES.length} jeux d’alcool à lancer en 10 secondes. Ouvre un salon, tes potes rejoignent depuis
              leur téléphone — ou passe le tien. Que le chaos commence.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={
                  connected && !isHost
                    ? '/salon'
                    : allPlayers.length >= 2
                      ? '/jeux'
                      : '/salon'
                }
                className="btn-primary"
              >
                {connected && !isHost
                  ? 'Rejoindre la table'
                  : allPlayers.length >= 2
                    ? 'Choisir un jeu'
                    : 'Créer un salon'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {(!connected || isHost) && (
                <Link to="/aleatoire" className="btn-ghost">
                  <Dices className="h-4 w-4" />
                  Jeu au hasard
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Users, title: 'Jusqu’à 12 joueurs', text: 'Un téléphone chacun, ou un seul pour tous.' },
          { icon: Dices, title: `${GAMES.length} jeux prêts`, text: 'Classiques, cartes, casino, défis.' },
          {
            icon: ShieldAlert,
            title: '18+ & responsable',
            text: 'Cherche les 💧 cachés. Bois de l’eau. Personne ne force personne.',
          },
        ].map((item) => (
          <div key={item.title} className="card p-4">
            <item.icon className="mb-2 h-5 w-5 text-fuchsia-300" />
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-white/60">{item.text}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="font-display text-2xl">Les hits de la table</h2>
          <div className="flex items-center gap-2">
            <WaterGlass id="home-hits" size="sm" />
            <Link to="/jeux" className="text-sm text-fuchsia-300 hover:underline">
              Tout voir
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {hits.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link to={`/jeu/${game.id}`} className="card group block overflow-hidden">
                <div className="relative h-36">
                  <img
                    src={game.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12061f] to-transparent" />
                  <span
                    className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black"
                    style={{ backgroundColor: game.accent }}
                  >
                    {game.duration}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{game.title}</h3>
                  <p className="text-sm text-white/60">{game.tagline}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-white/35">by Ardor521_AD</p>
      <span className="sr-only">{players.length}</span>
    </div>
  )
}