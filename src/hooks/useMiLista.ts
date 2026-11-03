import { useState, useEffect } from 'react'

export function useMiLista() {
  const [miLista, setMiLista] = useState<string[]>(() => {
    const saved = localStorage.getItem('tunetv_milista')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('tunetv_milista', JSON.stringify(miLista))
  }, [miLista])

  const toggleMiLista = (id: string) => {
    setMiLista(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id])
  }

  const isInMiLista = (id: string) => miLista.includes(id)

  return { miLista, toggleMiLista, isInMiLista }
}
