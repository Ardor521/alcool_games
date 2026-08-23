import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Pause, Play, Plus, RotateCcw, Trash2, UserPlus } from 'lucide-react'
import { useParty } from '../context/PartyContext'
import { SUGGESTED_NAMES } from '../lib/catalog'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { SipBadge } from '../components/SipToast'
import { WaterGlass } from '../components/WaterGlass'

export function Players() {
  const { allPlayers, addPlayer, removePlayer, clearPlayers, resetSips, togglePause, players, selfId, connected } =
    useParty()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!addPlayer(name)) {
      setError(allPlayers.length >= 12 ? 'Maximum 12 joueurs.' : 'Prénom vide ou déjà pris.')
      return
    }
    setName('')
    setError('')
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl">Les joueurs</h1>
          <WaterGlass id="players-title" size="sm" />
        </div>
        <p className="mt-1 text-sm text-white/60">
          {connected
            ? 'Les joueurs du salon apparaissent ici en direct. Pause s’il arrête de boire.'
            : 'Pause un joueur s’il arrête de boire : ses gorgées sont gardées, il disparaît des jeux jusqu’à réactivation.'}{' '}
          {players.length} actif{players.length > 1 ? 's' : ''}.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card flex items-center gap-2 p-2 pl-3">
        <UserPlus className="h-4 w-4 shrink-0 text-fuchsia-300" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom du joueur"
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
          maxLength={18}
        />
        <button type="submit" className="btn-primary !px-4 !py-2 text-sm">
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </form>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      {allPlayers.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_NAMES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => addPlayer(n)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
            >
              + {n}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {allPlayers.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`card flex items-center gap-3 px-3 py-2.5 ${p.paused ? 'opacity-55' : ''}`}
            >
              <span className="w-5 text-center text-xs text-white/35">{i + 1}</span>
              <PlayerAvatar player={p} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {p.name}
                  {p.id === selfId && (
                    <span className="ml-2 rounded-full bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] uppercase text-fuchsia-200">
                      toi
                    </span>
                  )}
                  {p.online === false && (
                    <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">
                      hors ligne
                    </span>
                  )}
                  {p.paused && (
                    <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                      pause
                    </span>
                  )}
                </p>
                <SipBadge sips={p.sips} />
              </div>
              <button
                type="button"
                onClick={() => togglePause(p.id)}
                className={`rounded-lg p-2 ${
                  p.paused
                    ? 'text-emerald-300 hover:bg-emerald-400/10'
                    : 'text-white/50 hover:bg-white/5 hover:text-amber-200'
                }`}
                aria-label={p.paused ? `Réactiver ${p.name}` : `Mettre ${p.name} en pause`}
                title={p.paused ? 'Réactiver' : 'Mettre en pause'}
              >
                {p.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => removePlayer(p.id)}
                className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-rose-300"
                aria-label={`Retirer ${p.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {allPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={resetSips} className="btn-ghost text-sm">
            <RotateCcw className="h-4 w-4" />
            Reset gorgées
          </button>
          <button type="button" onClick={clearPlayers} className="btn-ghost text-sm text-rose-200">
            Vider la liste
          </button>
        </div>
      )}

      {!connected && (
        <Link to="/salon" className="btn-ghost w-full justify-center text-sm">
          Jouer chacun sur son téléphone
        </Link>
      )}

      <Link to="/jeux" className={`btn-primary w-full justify-center ${players.length < 2 ? 'pointer-events-none opacity-40' : ''}`}>
        Continuer vers les jeux
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}