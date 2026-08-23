import { useSyncedState } from '../lib/useSyncedState'
import { AnimatePresence, motion } from 'framer-motion'
import { SkipForward } from 'lucide-react'
import { useParty } from '../context/PartyContext'
import { PICOLO_CARDS } from '../lib/catalog'
import { fillNames, pick, pickOther, shuffle } from '../lib/utils'
import { TurnBanner } from '../components/TurnBanner'
import { SipWho } from '../components/SipToast'
import { WaterGlass } from '../components/WaterGlass'
import type { PicoloCard, Player } from '../types'

const KIND_LABEL: Record<string, string> = {
  sip: 'Gorgées',
  shot: 'Shot',
  all: 'Tout le monde',
  vote: 'Vote',
  dare: 'Défi',
  rule: 'Règle',
  duo: 'Duo',
}

const KIND_CLS: Record<string, string> = {
  sip: 'bg-amber-400 text-black',
  shot: 'bg-rose-400 text-black',
  all: 'bg-fuchsia-400 text-black',
  vote: 'bg-violet-400 text-black',
  dare: 'bg-cyan-300 text-black',
  rule: 'bg-emerald-300 text-black',
  duo: 'bg-orange-300 text-black',
}

function pickTargets(players: Player[], turn: number, card: PicoloCard) {
  const p = players[turn % players.length]
  const o = card.text.includes('{o}') || card.kind === 'duo' ? pickOther(players, p.id) : undefined
  return card.kind === 'all' ? { p: pick(players), o } : { p, o }
}

export function PicoloGame() {
  const { players, addSips } = useParty()
  const [deck] = useSyncedState('picolo.deck', () => shuffle(PICOLO_CARDS))
  const [i, setI] = useSyncedState('picolo.i', 0)
  const [turn, setTurn] = useSyncedState('picolo.turn', 0)
  const [targets, setTargets] = useSyncedState('picolo.targets', () => pickTargets(players, 0, deck[0]))
  const card = deck[i % deck.length]
  const current = players[turn % players.length]

  const next = () => {
    const ni = i + 1
    const nt = (turn + 1) % players.length
    setI(ni)
    setTurn(nt)
    setTargets(pickTargets(players, nt, deck[ni % deck.length]))
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={current?.id} />
      <AnimatePresence mode="wait">
        <motion.div
          key={`${i}-${card.text}`}
          initial={{ rotateY: 80, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -80, opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="card relative min-h-[240px] overflow-hidden p-6"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${KIND_CLS[card.kind]}`}>
            {KIND_LABEL[card.kind]}
          </span>
          <p className="mt-5 font-display text-2xl leading-snug sm:text-3xl">
            {fillNames(card.text, targets.p?.name, targets.o?.name)}
          </p>
          <p className="mt-6 text-xs text-white/40">Carte {i + 1}</p>
        </motion.div>
      </AnimatePresence>
      <SipWho
        amount={2}
        reason="selon la carte (montant fixe de la règle affichée)"
        players={targets.o && targets.p ? [targets.p, targets.o] : targets.p ? [targets.p] : players}
        onConfirm={(id) => addSips(id, 2)}
      />
      <div className="flex justify-end">
        <WaterGlass id="picolo-corner" size="sm" />
      </div>
      <button type="button" onClick={next} className="btn-primary w-full justify-center py-3">
        Carte suivante
        <SkipForward className="h-4 w-4" />
      </button>
    </div>
  )
}