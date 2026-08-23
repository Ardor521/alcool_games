import { useState } from 'react'
import { useParty } from '../context/PartyContext'
import { newDeck, isRed } from '../lib/cards'
import type { PlayingCard } from '../types'
import { CardView } from '../components/CardView'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'

const HINTS = ['Rouge ou noir ?', 'Plus haut ou plus bas ?', 'Intérieur ou extérieur ?', 'Quel symbole ?']

export function RideBusBoard() {
  const { players, addSips } = useParty()
  const [deck, setDeck] = useState(() => newDeck())
  const [turn, setTurn] = useState(0)
  const [step, setStep] = useState(0)
  const [history, setHistory] = useState<PlayingCard[]>([])
  const [card, setCard] = useState<PlayingCard | null>(null)
  const [up, setUp] = useState(false)
  const [msg, setMsg] = useState('4 étapes. Choisis, puis retourne la carte.')
  const [choice, setChoice] = useState<string | null>(null)
  const player = players[turn % Math.max(players.length, 1)]

  const draw = () => {
    const src = deck.length ? deck : newDeck()
    const [c, ...rest] = src
    setDeck(rest.length ? rest : newDeck())
    return c
  }

  const play = (c: string) => {
    if (choice || card) return
    setChoice(c)
    const drawn = draw()
    setCard(drawn)
    setUp(false)
    window.setTimeout(() => {
      setUp(true)
      let ok = false
      if (step === 0) ok = c === 'red' ? isRed(drawn.suit) : !isRed(drawn.suit)
      if (step === 1) {
        const prev = history[0]
        ok = c === 'up' ? drawn.value > prev.value : drawn.value < prev.value
      }
      if (step === 2) {
        const lo = Math.min(history[0].value, history[1].value)
        const hi = Math.max(history[0].value, history[1].value)
        const inside = drawn.value > lo && drawn.value < hi
        ok = c === 'in' ? inside : !inside
      }
      if (step === 3) ok = drawn.suit === c
      const sips = step + 1
      const nextHist = [...history, drawn]
      if (ok) {
        setMsg(`Bien vu ! ${drawn.rank}${drawn.suit}.`)
        if (step === 3) {
          setMsg(`${player?.name} a fini le bus ! Donne 4 gorgées.`)
          window.setTimeout(() => resetTurn(), 900)
          return
        }
        setHistory(nextHist)
        setStep((s) => s + 1)
      } else {
        setMsg(`Raté (${drawn.rank}${drawn.suit}). ${player?.name} boit ${sips}.`)
        if (player) addSips(player.id, sips)
        window.setTimeout(() => resetTurn(), 900)
        return
      }
      setCard(null)
      setUp(false)
      setChoice(null)
    }, 350)
  }

  const resetTurn = () => {
    setStep(0)
    setHistory([])
    setCard(null)
    setUp(false)
    setChoice(null)
    setTurn((t) => t + 1)
    setMsg('Nouveau joueur. Rouge ou noir ?')
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={player?.id} hint={HINTS[step]} />
      <div className="flex min-h-[96px] flex-wrap justify-center gap-2">
        {history.map((c, i) => (
          <CardView key={`${c.rank}${c.suit}${i}`} card={c} faceUp small />
        ))}
        <CardView card={card} faceUp={up && !!card} small />
      </div>
      <p className="text-center text-sm text-white/60">{msg}</p>
      {!choice && (
        <>
          {step === 0 && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="rounded-full bg-rose-600 py-3 font-semibold" onClick={() => play('red')}>
                Rouge
              </button>
              <button type="button" className="btn-ghost justify-center" onClick={() => play('black')}>
                Noir
              </button>
            </div>
          )}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-ghost justify-center" onClick={() => play('down')}>
                Plus bas
              </button>
              <button type="button" className="btn-primary justify-center" onClick={() => play('up')}>
                Plus haut
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-primary justify-center" onClick={() => play('in')}>
                Intérieur
              </button>
              <button type="button" className="btn-ghost justify-center" onClick={() => play('out')}>
                Extérieur
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="grid grid-cols-4 gap-2">
              {(['♥', '♦', '♣', '♠'] as const).map((s) => (
                <button key={s} type="button" className="btn-ghost justify-center text-2xl" onClick={() => play(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {player && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(player.id, n)} />
        </div>
      )}
    </div>
  )
}