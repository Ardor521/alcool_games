export type ControlMode = 'host' | 'turn' | 'all'

const ALL_TOUCH = new Set([
  'jamais',
  'vote',
  'tuprefere',
  'imposteur',
  'mensonge',
  'rps',
  'beerpong',
  'hotseat',
])

export function defaultControl(gameId: string): ControlMode {
  if (ALL_TOUCH.has(gameId)) return 'all'
  return 'turn'
}

export function guestMayAct(
  type: string,
  control: ControlMode,
  isTurn: boolean,
  actorId: string,
  targetId?: string,
) {
  if (type === 'water') return true
  if (type === 'rename' || type === 'togglePause') return targetId === actorId
  if (type === 'sips' || type === 'gameSet' || type === 'gamePatch' || type === 'turn' || type === 'control') {
    return control === 'all' || isTurn
  }
  return false
}