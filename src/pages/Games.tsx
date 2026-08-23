import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Users } from 'lucide-react'
import { CATEGORIES, GAMES } from '../lib/catalog'
import { useParty } from '../context/PartyContext'
import { WaterGlass } from '../components/WaterGlass'

export function Games() {
  const { activePlayers } = useParty()
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const f = q.trim().toLowerCase()
    return GAMES.filter((g) => {
      if (cat !== 'all' && g.category !== cat) return false
      if (!f) return true
      return (
        g.title.toLowerCase().includes(f) ||
        g.tagline.toLowerCase().includes(f) ||
        g.description.toLowerCase().includes(f) ||
        g.id.toLowerCase().includes(f)
      )
    })
  }, [cat, q])

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl">Choisis ton jeu</h1>
          <WaterGlass id="games-title" size="sm" />
        </div>
        <p className="mt-1 text-sm text-white/60">
          {activePlayers.length < 2
            ? 'Ajoute au moins 2 joueurs actifs avant de lancer une partie.'
            : `${activePlayers.length} joueurs actifs · ${list.length} jeu${list.length > 1 ? 'x' : ''}`}
        </p>
      </div>

      <label className="card flex items-center gap-2 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-white/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher un jeu (ex: bataille, roulette, picolo…)"
          className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} className="text-xs text-white/45">
            Effacer
          </button>
        )}
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              cat === c.id
                ? 'bg-fuchsia-500 text-white'
                : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((g, i) => {
          const missing = activePlayers.length < g.minPlayers
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link
                to={missing ? '/joueurs' : `/jeu/${g.id}`}
                className={`card group block overflow-hidden ${missing ? 'opacity-70' : ''}`}
              >
                <div className="relative h-40">
                  <img
                    src={g.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12061f] via-[#12061f]/20 to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black"
                      style={{ backgroundColor: g.accent }}
                    >
                      {g.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/90 backdrop-blur">
                      <Users className="h-3 w-3" />
                      {g.minPlayers}+
                    </span>
                  </div>
                </div>
                <div className="space-y-1 p-4">
                  <h2 className="text-lg font-semibold">{g.title}</h2>
                  <p className="text-sm font-medium" style={{ color: g.accent }}>
                    {g.tagline}
                  </p>
                  <p className="text-sm text-white/55">{g.description}</p>
                  {missing && (
                    <p className="pt-1 text-xs text-amber-200">
                      Il manque des joueurs actifs — encore {g.minPlayers - activePlayers.length} min.
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {list.length === 0 && (
        <p className="text-sm text-white/50">
          Aucun jeu ne correspond à « {q} ».
        </p>
      )}
    </div>
  )
}