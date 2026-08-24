import type { Player } from '../types'

export function nextPlayerId(players: Player[], currentId?: string | null) {
  if (!players.length) return null
  const i = Math.max(0, players.findIndex((p) => p.id === currentId))
  return players[(i + 1) % players.length].id
}

export function playerByTurn(players: Player[], turnId?: string | null) {
  if (!players.length) return undefined
  return players.find((p) => p.id === turnId) ?? players[0]
}