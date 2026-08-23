export type Player = {
  id: string
  name: string
  color: string
  sips: number
  paused: boolean
  online?: boolean
  device?: boolean
}

export type GameCategory = 'classique' | 'cartes' | 'casino' | 'defis' | 'rapide'

export type GameDef = {
  id: string
  title: string
  tagline: string
  description: string
  minPlayers: number
  image: string
  accent: string
  duration: string
  category: GameCategory
}

export type Suit = '♥' | '♦' | '♣' | '♠'

export type PlayingCard = {
  suit: Suit
  rank: string
  value: number
}

export type PicoloKind = 'sip' | 'shot' | 'all' | 'vote' | 'dare' | 'rule' | 'duo'

export type PicoloCard = {
  kind: PicoloKind
  text: string
}

export type TruthCard = {
  type: 'verite' | 'action'
  text: string
}