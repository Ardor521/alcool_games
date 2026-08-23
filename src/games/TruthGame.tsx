import { useSyncedState } from '../lib/useSyncedState'
import { AnimatePresence, motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'
import { TRUTH_CARDS } from '../lib/catalog'
import { shuffle } from '../lib/utils'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'

export function TruthGame() {
  const { players, addSips } = useParty()
  const [truths] = useSyncedState('truth.deck', () =>
    shuffle(TRUTH_CARDS.filter((c) => c.type === 'verite').map((c) => c.text)),
  )
  const [actions] = useSyncedState('truth.acts', () =>
    shuffle(TRUTH_CARDS.filter((c) => c.type === 'action').map((c) => c.text)),
  )
  const [ti, setTi] = useSyncedState('truth.ti', 0)
  const [ai, setAi] = useSyncedState('truth.ai', 0)
  const [turn, setTurn] = useSyncedState('truth.turn', 0)
  const [card, setCard] = useSyncedState<{ type: 'verite' | 'action'; text: string } | null>('truth.card', null)
  const current = players[turn % players.length]

  const pick = (type: 'verite' | 'action') => {
    if (type === 'verite') {
      setCard({ type, text: truths[ti % truths.length] })
      setTi((x) => x + 1)
    } else {
      setCard({ type, text: actions[ai % actions.length] })
      setAi((x) => x + 1)
    }
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={current?.id} hint="Choisis vérité ou action." />
      <AnimatePresence mode="wait">
        {card ? (
          <motion.div
            key={card.text}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card space-y-4 p-6"
          >
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                card.type === 'verite' ? 'bg-cyan-300 text-black' : 'bg-fuchsia-400 text-black'
              }`}
            >
              {card.type === 'verite' ? 'Vérité' : 'Action'}
            </span>
            <p className="font-display text-2xl leading-snug">{card.text}</p>
            <p className="text-sm text-white/50">
              Refus ? {current.name} prend des gorgées. Sinon, passez au suivant.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">{current.name} refuse :</span>
              <SipButtons onSip={(n) => addSips(current.id, n)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => pick(card.type)} className="btn-ghost">
                Une autre carte
              </button>
              <button
                type="button"
                onClick={() => {
                  setCard(null)
                  setTurn((t) => (t + 1) % players.length)
                }}
                className="btn-primary flex-1 justify-center"
              >
                Joueur suivant
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="choice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <button type="button" onClick={() => pick('verite')} className="card min-h-[140px] p-5 text-left hover:bg-white/5">
              <p className="text-xs uppercase tracking-widest text-cyan-200">Vérité</p>
              <p className="mt-2 font-display text-2xl">Avoue tout</p>
              <p className="mt-2 text-sm text-white/55">Question gênante. Mensonge = 2 gorgées.</p>
            </button>
            <button type="button" onClick={() => pick('action')} className="card min-h-[140px] p-5 text-left hover:bg-white/5">
              <p className="text-xs uppercase tracking-widest text-fuchsia-200">Action</p>
              <p className="mt-2 font-display text-2xl">Fais-le</p>
              <p className="mt-2 text-sm text-white/55">Défi. Refus = cul sec (ou 4 gorgées).</p>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}