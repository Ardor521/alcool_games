import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParty } from '../context/PartyContext'
import { useRoom } from '../context/RoomContext'
import { GAMES } from '../lib/catalog'
import { pick } from '../lib/utils'

export function RandomGame() {
  const navigate = useNavigate()
  const { activePlayers } = useParty()
  const { connected, isHost } = useRoom()

  useEffect(() => {
    if (connected && !isHost) {
      navigate('/salon', { replace: true })
      return
    }
    if (activePlayers.length < 2) {
      navigate('/joueurs', { replace: true })
      return
    }
    const ok = GAMES.filter((g) => activePlayers.length >= g.minPlayers)
    const game = pick(ok.length ? ok : GAMES)
    navigate(`/jeu/${game.id}`, { replace: true })
  }, [navigate, activePlayers.length, connected, isHost])

  return <div className="flex min-h-[50vh] items-center justify-center text-white/60">Tirage au sort…</div>
}