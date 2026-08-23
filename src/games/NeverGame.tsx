import { useSyncedState } from '../lib/useSyncedState'
import { AnimatePresence, motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'
import { NEVER_PROMPTS } from '../lib/catalog'
import { shuffle } from '../lib/utils'
import { PlayerAvatar } from '../components/PlayerAvatar'

export function NeverGame() {
  const { players, addSips } = useParty()
  const [deck] = useSyncedState('never.deck', () => shuffle(NEVER_PROMPTS))
  const [i, setI] = useSyncedState('never.i', 0)
  const [drunk, setDrunk] = useSyncedState<Record<string, boolean>>('never.drunk', {})
  const phrase = deck[i % deck.length]

  const tap = (id: string) => {
    setDrunk((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      if (!prev[id]) addSips(id, 1)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          className="card p-6"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300">Je n’ai jamais…</p>
          <p className="mt-3 font-display text-2xl leading-snug sm:text-3xl">{phrase}</p>
          <p className="mt-4 text-sm text-white/55">Si tu l’as déjà fait, tape ton prénom. Tu bois 1 gorgée.</p>
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {players.map((p) => {
          const yes = !!drunk[p.id]
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => tap(p.id)}
              className={`card flex items-center gap-2 px-3 py-3 text-left transition ${
                yes ? 'bg-amber-400/10 ring-2 ring-amber-300/70' : 'hover:bg-white/5'
              }`}
            >
              <PlayerAvatar player={p} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-[11px] text-white/50">{yes ? 'a bu' : 'tapote si oui'}</p>
              </div>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          setI((x) => x + 1)
          setDrunk({})
        }}
        className="btn-primary w-full justify-center py-3"
      >
        Phrase suivante
      </button>
    </div>
  )
}