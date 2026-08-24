export type ControlMode = 'host' | 'turn' | 'all'

export function defaultControl(_gameId: string): ControlMode {
  return 'all'
}

export function guestMayAct(
  type: string,
  _control: ControlMode,
  _isTurn: boolean,
  actorId: string,
  targetId?: string,
) {
  if (type === 'water') return true
  if (type === 'rename' || type === 'togglePause') return targetId === actorId
  if (type === 'sips' || type === 'gameSet' || type === 'gamePatch' || type === 'turn') return true
  return false
}