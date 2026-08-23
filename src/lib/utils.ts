export function shuffle<T>(arr: T[]): T[] {
  const n = [...arr]
  for (let i = n.length - 1; i > 0; i -= 1) {
    const r = Math.floor(Math.random() * (i + 1))
    ;[n[i], n[r]] = [n[r], n[i]]
  }
  return n
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickOther<T extends { id: string }>(arr: T[], id: string): T {
  const rest = arr.filter((p) => p.id !== id)
  return rest.length ? pick(rest) : arr[0]
}

export function fillNames(text: string, p?: string, o?: string) {
  return text.split('{p}').join(p ?? 'quelqu’un').split('{o}').join(o ?? 'un autre')
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}