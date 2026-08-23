const DOTS: Record<number, string[]> = {
  1: ['center'],
  2: ['tl', 'br'],
  3: ['tl', 'center', 'br'],
  4: ['tl', 'tr', 'bl', 'br'],
  5: ['tl', 'tr', 'center', 'bl', 'br'],
  6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
}

const POS: Record<string, string> = {
  tl: 'top-1.5 left-1.5',
  tr: 'top-1.5 right-1.5',
  ml: 'top-1/2 left-1.5 -translate-y-1/2',
  mr: 'top-1/2 right-1.5 -translate-y-1/2',
  bl: 'bottom-1.5 left-1.5',
  br: 'bottom-1.5 right-1.5',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
}

export function DiceFace({ n }: { n: number }) {
  return (
    <div className="relative h-16 w-16 rounded-xl bg-white shadow-xl">
      {(DOTS[n] ?? []).map((d) => (
        <span key={d} className={`absolute h-2.5 w-2.5 rounded-full bg-zinc-900 ${POS[d]}`} />
      ))}
    </div>
  )
}

export function DicePip({ n, small = false }: { n: number; small?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-white font-black text-zinc-900 shadow ${
        small ? 'h-7 w-7 text-sm' : 'h-12 w-12 text-lg'
      }`}
    >
      {n}
    </div>
  )
}