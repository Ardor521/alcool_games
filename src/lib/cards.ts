import type { PlayingCard, Suit } from '../types'
import { shuffle } from './utils'

export const SUITS: Suit[] = ['♥', '♦', '♣', '♠']

const RANKS = [
  { rank: 'A', value: 14 },
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 11 },
  { rank: 'Q', value: 12 },
  { rank: 'K', value: 13 },
]

export function newDeck(): PlayingCard[] {
  const deck: PlayingCard[] = []
  for (const suit of SUITS) {
    for (const r of RANKS) {
      deck.push({ suit, rank: r.rank, value: r.value })
    }
  }
  return shuffle(deck)
}

export function isRed(suit: Suit) {
  return suit === '♥' || suit === '♦'
}