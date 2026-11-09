import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useUserAuth } from './UserAuthContext'

type CategoryId = 'movies' | 'kids' | 'deportes' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico'

const VALID_CATEGORIES: CategoryId[] = ['movies', 'kids', 'deportes', 'entretenimiento', 'historia', 'premium', 'cineclasico']

const normalizeCategory = (cat: string | undefined | null): CategoryId => {
  if (!cat) return 'movies'
  const lower = cat.toLowerCase().trim()
  if (VALID_CATEGORIES.includes(lower as CategoryId)) return lower as CategoryId
  return 'movies'
}

const normalizeGenre = (genre: string | undefined | null): string => {
  if (!genre) return 'Movies'
  const lower = genre.toLowerCase().trim()
  if (lower === 'movies' || lower === 'movie' || lower === 'pelicula' || lower === 'película') return 'Movies'
  if (lower === 'series' || lower === 'serie') return 'Series'
  return genre.charAt(0).toUpperCase() + genre.slice(1)
}

export interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  group?: string
  category: CategoryId
  owner_id?: string
}

export interface Movie {
  id: string
  title: string
  year: number
  genre: string
  rating: number
  poster?: string
  url: string
  description?: string
  category: CategoryId
  episodes?: { title: string; url: string }[]
  owner_id?: string
}

interface ContentContextType {
  channels: Channel[]
  movies: Movie[]
  addChannel: (channel: Omit<Channel, 'id'>) => Promise<void>
  removeChannel: (id: string) => Promise<void>
  addMovie: (movie: Omit<Movie, 'id'>) => Promise<void>
  removeMovie: (id: string) => Promise<void>
  importM3U: (content: string, category: string) => Promise<number>
  loading: boolean
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

export function ContentProvider({ children }: { children: ReactNode }) {
  const { user } = useUserAuth() // 👈 Obtenemos el usuario logueado
  const [channels, setChannels] = useState<Channel[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const normalizeChannel = (c: any): Channel => ({
    id: c.id,
    name: c.name,
    url: c.url,
    logo: c.logo || undefined,
    group: c.group || undefined,
    category: normalizeCategory(c.category),
    owner_id: c.owner_id || undefined
  })

  const normalizeMovie = (m: any): Movie => ({
    id: m.id,
    title: m.title,
    year: m.year || new Date().getFullYear(),
    genre: normalizeGenre(m.genre),
    rating: Number(m.rating) || 7.5,
    poster: m.poster || undefined,
    url: m.url,
    description: m.description || undefined,
    category: normalizeCategory(m.category),
    episodes: m.episodes || undefined,
    owner_id: m.owner_id || undefined
  })

  const loadData = async () => {
    try {
      const { data: channelsData, error: cErr } = await supabase.from('channels').select('*').order('created_at', { ascending: false })
      const { data: moviesData, error: mErr } = await supabase.from('movies').select('*').order('created_at', { ascending: false })

      if (cErr) console.error('Error cargando canales:', cErr)
      if (mErr) console.error('Error cargando películas:', mErr)

      setChannels((channelsData || []).map(normalizeChannel))
      setMovies((moviesData || []).map(normalizeMovie))
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const addChannel = async (channel: Omit<Channel, 'id'>) => {
    const normalized = {
      name: channel.name,
      url: channel.url,
      logo: channel.logo || null,
      group: channel.group || null,
      category: normalizeCategory(channel.category),
      owner_id: user?.id || null // 👈 Asignamos el dueño
    }
    const { data, error } = await supabase.from('channels').insert([normalized]).select().single()
    if (error) console.error('❌ Error al agregar canal:', error)
    else if (data) setChannels(prev => [normalizeChannel(data), ...prev])
  }

  const removeChannel = async (id: string) => {
    if (!id) return
    const channel = channels.find(c => c.id === id)
    // 👈 VERIFICACIÓN DE PERMISOS: Solo el dueño puede borrar
    if (channel && channel.owner_id && channel.owner_id !== user?.id) {
      console.error('❌ No tienes permiso para eliminar este canal (no eres el dueño)')
      return
    }
    const { error } = await supabase.from('channels').delete().eq('id', id)
    if (!error) setChannels(prev => prev.filter(c => c.id !== id))
  }

  const addMovie = async (movie: Omit<Movie, 'id'>) => {
    const movieData = {
      title: movie.title,
      url: movie.url,
      poster: movie.poster || null,
      description: movie.description || null,
      rating: Number(movie.rating) || 7.5,
      year: movie.year || new Date().getFullYear(),
      genre: normalizeGenre(movie.genre),
      category: normalizeCategory(movie.category),
      episodes: movie.episodes || null,
      owner_id: user?.id || null // 👈 Asignamos el dueño
    }

    console.log('🎬 Enviando a Supabase:', movieData)

    const { data, error } = await supabase.from('movies').insert([movieData]).select().single()

    if (error) {
      console.error('❌ ERROR DE SUPABASE AL GUARDAR:', error)
      throw error
    } else if (data) {
      console.log('✅ Película/Serie guardada:', data)
      setMovies(prev => [normalizeMovie(data), ...prev])
    }
  }

  const removeMovie = async (id: string) => {
    if (!id) return
    const movie = movies.find(m => m.id === id)
    // 👈 VERIFICACIÓN DE PERMISOS: Solo el dueño puede borrar
    if (movie && movie.owner_id && movie.owner_id !== user?.id) {
      console.error('❌ No tienes permiso para eliminar esta película (no eres el dueño)')
      return
    }
    const { error } = await supabase.from('movies').delete().eq('id', id)
    if (!error) setMovies(prev => prev.filter(m => m.id !== id))
  }

  const importM3U = async (content: string, category: string): Promise<number> => {
    const normalizedCategory = normalizeCategory(category)
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
        newChannels.push({ name: currentName, url: line, logo: currentLogo || undefined, group: currentGroup, category: normalizedCategory })
        currentName = ''
        currentLogo = ''
        currentGroup = ''
      }
    }

    if (newChannels.length === 0) return 0

    // 👈 Asignamos el dueño a los canales importados en masa
    const channelsToInsert = newChannels.map(c => ({ ...c, owner_id: user?.id || null }))
    const { data, error } = await supabase.from('channels').insert(channelsToInsert).select()
    
    if (error) {
      console.error('❌ ERROR DE SUPABASE:', error)
      return 0
    }
    
    if (data) {
      setChannels(prev => [...data.map(normalizeChannel), ...prev])
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