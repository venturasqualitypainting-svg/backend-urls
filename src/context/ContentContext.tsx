import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  addChannel: (channel: Omit<Channel, 'id'>) => void
  removeChannel: (id: string) => void
  addMovie: (movie: Omit<Movie, 'id'>) => void
  removeMovie: (id: string) => void
  importM3U: (content: string, category: Channel['category']) => number
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)
const STORAGE_KEY = 'tunetv_content'

const defaultChannels: Channel[] = [
  { id: 'ch1', name: 'Canal Demo 1', url: 'https://cph-p2p-msl.akamaized.net/hls/live/809164/cph-master/master.m3u8', group: 'General', category: 'movies' },
  { id: 'ch2', name: 'Canal Demo 2', url: 'https://stream.mux.com/v69eCMasP01008kFHKrBxXmT00d4M4k4mM.m3u8', group: 'General', category: 'movies' },
]

const defaultMovies: Movie[] = [
  { id: 'mv1', title: 'Big Buck Bunny', year: 2008, genre: 'Animación', rating: 8.2, duration: '10 min', poster: '🐰', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', description: 'Un conejo gigante y amigable.', category: 'movies' },
]

export function ContentProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        return data.channels || defaultChannels
      } catch {
        return defaultChannels
      }
    }
    return defaultChannels
  })

  const [movies, setMovies] = useState<Movie[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        return data.movies || defaultMovies
      } catch {
        return defaultMovies
      }
    }
    return defaultMovies
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ channels, movies }))
  }, [channels, movies])

  const addChannel = (channel: Omit<Channel, 'id'>) => {
    const newChannel: Channel = {
      ...channel,
      id: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    setChannels(prev => [...prev, newChannel])
  }

  const removeChannel = (id: string) => {
    setChannels(prev => prev.filter(c => c.id !== id))
  }

  const addMovie = (movie: Omit<Movie, 'id'>) => {
    const newMovie: Movie = {
      ...movie,
      id: `mv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    setMovies(prev => [...prev, newMovie])
  }

  const removeMovie = (id: string) => {
    setMovies(prev => prev.filter(m => m.id !== id))
  }

  const importM3U = (content: string, category: Channel['category']): number => {
    const lines = content.split('\n')
    const newChannels: Channel[] = []
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
        newChannels.push({
          id: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: currentName,
          url: line,
          logo: currentLogo || undefined,
          group: currentGroup,
          category: category // SIEMPRE respeta la categoría seleccionada
        })
        currentName = ''
        currentLogo = ''
        currentGroup = ''
      }
    }

    if (newChannels.length > 0) {
      setChannels(prev => [...prev, ...newChannels])
    }

    return newChannels.length
  }

  return (
    <ContentContext.Provider value={{
      channels,
      movies,
      addChannel,
      removeChannel,
      addMovie,
      removeMovie,
      importM3U
    }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const context = useContext(ContentContext)
  if (!context) throw new Error('useContent must be used within ContentProvider')
  return context
}
