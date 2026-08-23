import { useState } from 'react'
import { useParty } from '../context/PartyContext'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'
import { DiceFace } from '../components/DiceFace'

export function DiceBoard() {
  const { players, addSips } = useParty()
  const [turn, setTurn] = useState(0)
  const [dice, setDice] = useState<[number, number] | null>(null)
  const [msg, setMsg] = useState('Tape les dés pour lancer.')
  const [rolling, setRolling] = useState(false)
  const player = players[turn % Math.max(players.length, 1)]

  const roll = () => {
    if (!player || rolling) return
    setRolling(true)
    let n = 0
    const t = window.setInterval(() => {
      setDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)])
      n += 1
      if (n > 8) {
        window.clearInterval(t)
        const a = 1 + Math.floor(Math.random() * 6)
        const b = 1 + Math.floor(Math.random() * 6)
        setDice([a, b])
        const sum = a + b
        if (a === b) setMsg(`Double ${a} ! ${player.name} donne ${a} gorgées.`)
        else if (sum === 7) {
          setMsg('7 ! Tout le monde boit 1.')
          players.forEach((p) => addSips(p.id, 1))
        } else if (sum === 11) {
          setMsg(`11 ! ${player.name} boit 3.`)
          addSips(player.id, 3)
        } else if (sum === 2) {
          setMsg(`Snake eyes ! ${player.name} cul sec (4).`)
          addSips(player.id, 4)
        } else if (sum === 12) {
          setMsg('12 ! Voisins boivent 2.')
          const i = turn % players.length
          addSips(players[(i + 1) % players.length].id, 2)
          addSips(players[(i + players.length - 1) % players.length].id, 2)
        } else {
          setMsg(`${sum} : ${player.name} boit 1.`)
          addSips(player.id, 1)
        }
        setTurn((x) => x + 1)
        setRolling(false)
      }
    }, 70)
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={players[turn % Math.max(players.length, 1)]?.id} hint="Prochain lanceur" />
      <button type="button" onClick={roll} className="card flex min-h-[160px] w-full flex-col items-center justify-center gap-3 p-6">
        {dice ? (
          <div className="flex gap-4">
            <DiceFace n={dice[0]} />
            <DiceFace n={dice[1]} />
          </div>
        ) : (
          <p className="text-4xl">🎲</p>
        )}
        <p className="text-center text-sm text-white/75">{msg}</p>
      </button>
      <button type="button" onClick={roll} className="btn-primary w-full justify-center py-3" disabled={rolling}>
        {rolling ? 'Les dés roulent…' : 'Lancer les dés'}
      </button>
      {player && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(player.id, n)} />
        </div>
      )}
    </div>
  )
}