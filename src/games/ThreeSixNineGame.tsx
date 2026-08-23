import { useState } from 'react'
import { useParty } from '../context/PartyContext'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'

function isClap(n: number) {
  return n % 3 === 0 || n % 6 === 0 || n % 9 === 0 || /[369]/.test(String(n))
}

export function ThreeSixNineGame() {
  const { players, addSips } = useParty()
  const [n, setN] = useState(1)
  const [turn, setTurn] = useState(0)
  const player = players[turn % Math.max(players.length, 1)]
  const clap = isClap(n)

  const advance = () => {
    setN((x) => x + 1)
    setTurn((t) => t + 1)
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={player?.id} hint={clap ? 'Dis « clap »' : `Dis ${n}`} />
      <p className="text-sm text-white/65">
        Comptez à voix haute. Multiple ou chiffre 3/6/9 → dites « clap » (ou tapez dans les mains) au lieu du nombre.
      </p>
      <div className="card p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-emerald-200">Nombre</p>
        <p className="font-display text-6xl">{n}</p>
        <p className="mt-2 text-sm text-white/70">
          À <strong className="text-white">{player?.name}</strong> — {clap ? 'CLAP attendu' : 'dire le nombre'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={advance} className="btn-primary justify-center py-3">
          Correct
        </button>
        <button
          type="button"
          onClick={() => {
            if (player) addSips(player.id, 2)
            advance()
          }}
          className="btn-ghost justify-center py-3 text-rose-200"
        >
          Raté (+2)
        </button>
      </div>
      {player && (
        <div className="card p-3">
          <SipButtons onSip={(x) => addSips(player.id, x)} />
        </div>
      )}
    </div>
  )
}