import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { useRoom } from '../context/RoomContext'

export function RoomBar() {
  const { connected, roomCode, isHost, players } = useRoom()
  if (!connected || !roomCode) return null
  const online = players.filter((p) => p.online !== false).length
  return (
    <Link
      to="/salon"
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-200"
    >
      <Radio className="h-3 w-3" />
      {roomCode}
      <span className="text-emerald-200/60">· {online}</span>
      {isHost && <span className="text-[9px] uppercase tracking-wide text-amber-200">hôte</span>}
    </Link>
  )
}