import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  group?: string
  category: string
}

export interface Movie {
  id: string
  title: string
  url: string
  poster?: string
  description?: string
  category: string
  genre?: string
}

interface ContentContextType {
  channels: Channel[]
  movies: Movie[]
  loading: boolean
  refreshData: () => Promise<void>
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando datos desde Supabase...')
      
      const { data: channelsData, error: cErr } = await supabase.from('channels').select('*')
      const { data: moviesData, error: mErr } = await supabase.from('movies').select('*')

      if (cErr) console.error('❌ Error canales:', cErr)
      if (mErr) console.error('❌ Error películas:', mErr)

      // Normalizar a minúsculas para evitar fallos en el filtro de categorías
      const normalizedChannels = (channelsData || []).map((c: any) => ({
        ...c,
        category: (c.category || 'movies').toLowerCase().trim()
      }))

      const normalizedMovies = (moviesData || []).map((m: any) => ({
        ...m,
        category: (m.category || 'movies').toLowerCase().trim()
      }))

      console.log(`✅ Canales cargados: ${normalizedChannels.length}`)
      console.log(`✅ Películas cargadas: ${normalizedMovies.length}`)

      setChannels(normalizedChannels)
      setMovies(normalizedMovies)
    } catch (error) {
      console.error('❌ Error general:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <ContentContext.Provider value={{ channels, movies, loading, refreshData: loadData }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const context = useContext(ContentContext)
  if (!context) throw new Error('useContent must be used within ContentProvider')
  return context
}
