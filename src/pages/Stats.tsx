import { Crown, Beer, RotateCcw } from 'lucide-react'
import { useParty } from '../context/PartyContext'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { WaterGlass } from '../components/WaterGlass'

export function Stats() {
  const { allPlayers, resetSips, waterCount, waterFound } = useParty()
  const ranked = [...allPlayers].sort((a, b) => b.sips - a.sips)
  const total = allPlayers.reduce((s, p) => s + p.sips, 0)
  const champ = ranked[0]

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl">Tableau de bord</h1>
          <WaterGlass id="stats-title" size="sm" hint />
        </div>
        <p className="mt-1 text-sm text-white/60">Compteur de gorgées de la soirée. Amical, pas scientifique.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">Gorgées d’alcool</p>
          <p className="mt-1 font-display text-3xl text-amber-300">{total}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-white/45">Verres d’eau 💧</p>
          <p className="mt-1 font-display text-3xl text-sky-300">{waterCount}</p>
          <p className="mt-1 text-[11px] text-white/45">{waterFound.length} cachettes trouvées</p>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs uppercase tracking-wide text-white/45">Champion du verre</p>
        <p className="mt-1 truncate font-display text-3xl text-fuchsia-300">
          {champ && champ.sips > 0 ? champ.name : '—'}
        </p>
      </div>

      {ranked.length === 0 && <p className="text-sm text-white/50">Ajoute des joueurs pour voir les stats.</p>}

      <div className="space-y-2">
        {ranked.map((p, i) => (
          <div key={p.id} className="card flex items-center gap-3 px-3 py-2.5">
            <span className="w-6 text-center text-sm text-white/40">
              {i === 0 && p.sips > 0 ? <Crown className="mx-auto h-4 w-4 text-amber-300" /> : i + 1}
            </span>
            <PlayerAvatar player={p} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-300"
                  style={{ width: `${total ? Math.max(8, (p.sips / Math.max(ranked[0].sips, 1)) * 100) : 0}%` }}
                />
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm text-amber-200">
              <Beer className="h-4 w-4" />
              {p.sips}
            </span>
          </div>
        ))}
      </div>

      {allPlayers.length > 0 && (
        <button type="button" onClick={resetSips} className="btn-ghost">
          <RotateCcw className="h-4 w-4" />
          Remettre les compteurs à zéro
        </button>
      )}

      <p className="text-xs leading-relaxed text-white/40">
        Rappel : cherche les 💧 cachés dans l’appli, bois de l’eau, mange un truc, et arrête-toi quand tu veux. Un
        refus est toujours valide. Interdit aux mineurs.
      </p>
    </div>
  )
}