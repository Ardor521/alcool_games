import { useState } from 'react'
import { useParty } from '../context/PartyContext'
import { newDeck } from '../lib/cards'
import type { PlayingCard } from '../types'
import { CardView } from '../components/CardView'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'

export function MiniBusBoard() {
  const { players, addSips } = useParty()
  const [deck, setDeck] = useState(() => newDeck())
  const [current, setCurrent] = useState<PlayingCard | null>(null)
  const [next, setNext] = useState<PlayingCard | null>(null)
  const [up, setUp] = useState(false)
  const [streak, setStreak] = useState(0)
  const [turn, setTurn] = useState(0)
  const [msg, setMsg] = useState('Retourne la première carte.')
  const [outcome, setOutcome] = useState<'win' | 'lose' | null>(null)
  const [guess, setGuess] = useState<string | null>(null)
  const player = players[turn % Math.max(players.length, 1)]

  const take = (from: PlayingCard[]) => {
    const src = from.length ? from : newDeck()
    return { card: src[0], rest: src.slice(1) }
  }

  const start = () => {
    const { card, rest } = take(deck)
    setCurrent(card)
    setDeck(rest)
    setMsg('Plus haut, plus bas, ou égal ?')
    setOutcome(null)
  }

  const play = (dir: 'up' | 'down' | 'same') => {
    if (!current || next) return
    const { card, rest } = take(deck)
    setGuess(dir)
    setNext(card)
    setUp(false)
    setDeck(rest)
    window.setTimeout(() => {
      setUp(true)
      const diff = card.value - current.value
      if ((dir === 'up' && diff > 0) || (dir === 'down' && diff < 0) || (dir === 'same' && diff === 0)) {
        const s = streak + 1
        setStreak(s)
        setOutcome('win')
        setMsg(s >= 5 ? `Bus validé ! ${player?.name} donne 5 gorgées.` : `Bien vu. Série ${s}/5.`)
      } else {
        setOutcome('lose')
        setStreak(0)
        const sips = Math.min(4, Math.abs(diff) || 1)
        setMsg(`Raté. ${player?.name} boit ${sips} gorgée(s).`)
        if (player) addSips(player.id, sips)
      }
    }, 280)
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={player?.id} hint={`Série ${streak}/5`} />
      <div className="flex justify-center gap-4">
        <div className="text-center">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-white/45">En jeu</p>
          {current ? (
            <CardView card={current} faceUp />
          ) : (
            <CardView faceUp={false} onClick={start} label="Retourner" />
          )}
        </div>
        <div className="text-center">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-white/45">Prochaine</p>
          {next ? (
            <CardView card={next} faceUp={up} />
          ) : (
            <CardView faceUp={false} disabled={!current || !!guess} onClick={current ? undefined : start} />
          )}
        </div>
      </div>
      <p className="text-center text-sm text-white/70">{msg}</p>
      {current && !next && (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => play('down')} className="btn-ghost justify-center py-3">
            Plus bas
          </button>
          <button type="button" onClick={() => play('same')} className="btn-ghost justify-center py-3">
            Égal
          </button>
          <button type="button" onClick={() => play('up')} className="btn-ghost justify-center py-3">
            Plus haut
          </button>
        </div>
      )}
      {!current && (
        <button type="button" onClick={start} className="btn-primary w-full justify-center py-3">
          Retourner la première carte
        </button>
      )}
      {next && up && (
        <button
          type="button"
          onClick={() => {
            setCurrent(next)
            setNext(null)
            setUp(false)
            setGuess(null)
            setOutcome(null)
            setMsg('Encore ? Plus haut / plus bas / égal.')
          }}
          className="btn-primary w-full justify-center py-3"
        >
          Continuer avec cette carte
        </button>
      )}
      {player && outcome === 'lose' && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(player.id, n)} />
        </div>
      )}
      {current && (
        <button
          type="button"
          onClick={() => {
            setTurn((t) => t + 1)
            setStreak(0)
            setOutcome(null)
            setNext(null)
            setUp(false)
            setGuess(null)
            setMsg('Nouveau joueur. Continue sur cette carte ou retire.')
          }}
          className="btn-ghost w-full justify-center"
        >
          Passer au joueur suivant
        </button>
      )}
    </div>
  )
}