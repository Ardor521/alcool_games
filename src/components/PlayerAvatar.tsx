import type { Player } from '../types'
import { initials } from '../lib/utils'

export function PlayerAvatar({ player, size = 'md' }: { player: Player; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'sm' ? 'h-8 w-8 text-[11px]' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'
  return (
    <div
      className={`${box} flex shrink-0 items-center justify-center rounded-full font-semibold text-black shadow-lg`}
      style={{ backgroundColor: player.color, boxShadow: `0 0 16px ${player.color}55` }}
    >
      {initials(player.name)}
    </div>
  )
}