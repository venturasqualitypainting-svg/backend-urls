import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  group?: string
  category: 'movies' | 'kids' | 'deportes' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico'
}

export interface Movie {
  id: string
  title: string
  year: number
  genre: string
  rating: number
  duration: string
  poster: string
  url: string
  description: string
  category: 'movies' | 'kids' | 'deportes' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico'
}

interface ContentContextType {
  channels: Channel[]
  movies: Movie[]
  addChannel: (channel: Omit<Channel, 'id'>) => Promise<void>
  removeChannel: (id: string) => Promise<void>
  addMovie: (movie: Omit<Movie, 'id'>) => Promise<void>
  removeMovie: (id: string) => Promise<void>
  importM3U: (content: string, category: Channel['category']) => Promise<number>
  loading: boolean
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: channelsData } = await supabase.from('channels').select('*').order('created_at', { ascending: false })
      const { data: moviesData } = await supabase.from('movies').select('*').order('created_at', { ascending: false })

      if (channelsData) setChannels(channelsData)
      if (moviesData) setMovies(moviesData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const addChannel = async (channel: Omit<Channel, 'id'>) => {
    const { data, error } = await supabase.from('channels').insert([channel]).select().single()
    if (!error && data) setChannels(prev => [...prev, data])
  }

  const removeChannel = async (id: string) => {
    const { error } = await supabase.from('channels').delete().eq('id', id)
    if (!error) setChannels(prev => prev.filter(c => c.id !== id))
  }

  const addMovie = async (movie: Omit<Movie, 'id'>) => {
    const { data, error } = await supabase.from('movies').insert([movie]).select().single()
    if (!error && data) setMovies(prev => [...prev, data])
  }

  const removeMovie = async (id: string) => {
    const { error } = await supabase.from('movies').delete().eq('id', id)
    if (!error) setMovies(prev => prev.filter(m => m.id !== id))
  }

  const importM3U = async (content: string, category: Channel['category']): Promise<number> => {
    const lines = content.split('\n')
    const newChannels: Omit<Channel, 'id'>[] = []
    let currentName = ''
    let currentLogo = ''
    let currentGroup = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,([^,]+)$/i)
        const logoMatch = line.match(/tvg-logo="([^"]*)"/i)
        const groupMatch = line.match(/group-title="([^"]*)"/i)
        currentName = nameMatch ? nameMatch[1].trim() : 'Canal sin nombre'
        currentLogo = logoMatch ? logoMatch[1] : ''
        currentGroup = groupMatch ? groupMatch[1] : 'Importados'
      } else if (line && !line.startsWith('#')) {
        newChannels.push({ name: currentName, url: line, logo: currentLogo || undefined, group: currentGroup, category })
        currentName = ''
        currentLogo = ''
        currentGroup = ''
      }
    }

    if (newChannels.length === 0) return 0

    const { data, error } = await supabase.from('channels').insert(newChannels).select()
    if (!error && data) {
      setChannels(prev => [...prev, ...data])
      return data.length
    }
    return 0
  }

  return (
    <ContentContext.Provider value={{ channels, movies, addChannel, removeChannel, addMovie, removeMovie, importM3U, loading }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const context = useContext(ContentContext)
  if (!context) throw new Error('useContent must be used within ContentProvider')
  return context
}
