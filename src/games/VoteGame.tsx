import { useSyncedState } from '../lib/useSyncedState'
import { AnimatePresence, motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'
import { VOTE_PROMPTS } from '../lib/catalog'
import { shuffle } from '../lib/utils'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { WaterGlass } from '../components/WaterGlass'

export function VoteGame() {
  const { players, addSips } = useParty()
  const [deck] = useSyncedState('vote.deck', () => shuffle(VOTE_PROMPTS))
  const [i, setI] = useSyncedState('vote.i', 0)
  const [votes, setVotes] = useSyncedState<Record<string, number>>('vote.votes', {})
  const [revealed, setRevealed] = useSyncedState('vote.revealed', false)
  const q = deck[i % deck.length]
  const total = Object.values(votes).reduce((s, n) => s + n, 0)
  const max = Math.max(0, ...Object.values(votes))
  const winners = players.filter((p) => (votes[p.id] ?? 0) === max && max > 0)

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card p-6"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-rose-200">Qui est le plus…</p>
          <p className="mt-3 font-display text-2xl leading-snug sm:text-3xl">{q}</p>
          <p className="mt-3 text-sm text-white/55">
            Chaque joueur vote une fois (ou plus si vous trichez 😇). Puis révélez.
          </p>
        </motion.div>
      </AnimatePresence>
      <div className="space-y-2">
        {players.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              if (!revealed) setVotes((v) => ({ ...v, [p.id]: (v[p.id] ?? 0) + 1 }))
            }}
            className="card flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5"
          >
            <PlayerAvatar player={p} size="sm" />
            <span className="flex-1 font-medium">{p.name}</span>
            {revealed ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {votes[p.id] ?? 0} vote{(votes[p.id] ?? 0) > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-xs text-white/40">voter</span>
            )}
          </button>
        ))}
      </div>
      {revealed ? (
        <div className="space-y-3">
          <div className="card p-4">
            <p className="text-sm text-white/60">Résultat</p>
            <p className="mt-1 font-display text-xl">
              {winners.map((p) => p.name).join(' & ')} {winners.length > 1 ? 'boivent' : 'boit'} !
            </p>
            <button
              type="button"
              className="btn-primary mt-3 w-full justify-center"
              onClick={() => winners.forEach((p) => addSips(p.id, 2))}
            >
              Les élus boivent 2 gorgées
            </button>
            <div className="mt-2 flex justify-end">
              <WaterGlass id="vote-water" size="sm" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setI((x) => x + 1)
              setVotes({})
              setRevealed(false)
            }}
            className="btn-primary w-full justify-center py-3"
          >
            Question suivante
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={total === 0}
          onClick={() => setRevealed(true)}
          className="btn-primary w-full justify-center py-3 disabled:opacity-40"
        >
          Révéler ({total} vote{total > 1 ? 's' : ''})
        </button>
      )}
    </div>
  )
}