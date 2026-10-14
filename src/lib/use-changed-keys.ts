import { useEffect, useState } from 'react'

type Entries = ReadonlyArray<readonly [key: string, value: string]>

const NONE: ReadonlySet<string> = new Set()

function changedKeys(previous: string, next: string): ReadonlySet<string> {
  const before = new Map(JSON.parse(previous) as [string, string][])
  const keys = (JSON.parse(next) as [string, string][])
    .filter(([key, value]) => before.get(key) !== value)
    .map(([key]) => key)
  return keys.length > 0 ? new Set(keys) : NONE
}

/**
 * Chaves cujo valor mudou (ou que surgiram) desde a última renderização com dados, durante `durationMs` (DESIGN 9).
 * `undefined` = carregando: a primeira carga nunca destaca nada.
 */
export function useChangedKeys(entries: Entries | undefined, durationMs = 1200): ReadonlySet<string> {
  const signature = entries === undefined ? null : JSON.stringify(entries)
  const [previous, setPrevious] = useState(signature)
  const [changed, setChanged] = useState(NONE)

  // Ajuste de estado durante a renderização (padrão do React para "valor anterior"), sem efeito extra.
  if (signature !== previous) {
    setPrevious(signature)
    if (previous !== null && signature !== null) setChanged(changedKeys(previous, signature))
  }

  useEffect(() => {
    if (changed.size === 0) return
    const timer = setTimeout(() => setChanged(NONE), durationMs)
    return () => clearTimeout(timer)
  }, [changed, durationMs])

  return changed
}
