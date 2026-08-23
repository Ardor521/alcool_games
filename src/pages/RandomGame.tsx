import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParty } from '../context/PartyContext'
import { GAMES } from '../lib/catalog'
import { pick } from '../lib/utils'

export function RandomGame() {
  const navigate = useNavigate()
  const { activePlayers } = useParty()

  useEffect(() => {
    if (activePlayers.length < 2) {
      navigate('/joueurs', { replace: true })
      return
    }
    const ok = GAMES.filter((g) => activePlayers.length >= g.minPlayers)
    const game = pick(ok.length ? ok : GAMES)
    navigate(`/jeu/${game.id}`, { replace: true })
  }, [navigate, activePlayers.length])

  return <div className="flex min-h-[50vh] items-center justify-center text-white/60">Tirage au sort…</div>
}