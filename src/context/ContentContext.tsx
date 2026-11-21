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
  addChannel: (channel: Omit<Channel, 'id'>) => Promise<{ success: boolean; message: string }>
  removeChannel: (id: string) => Promise<void>
  updateChannel: (id: string, updates: Partial<Pick<Channel, 'url' | 'group' | 'name'>>) => Promise<{ success: boolean; message: string }>
  importM3U: (content: string, category: string) => Promise<number>
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

  const addChannel = async (channel: Omit<Channel, 'id'>) => {
    const normalizedCategory = (channel.category || 'movies').toLowerCase().trim()
    const newChannel = { ...channel, category: normalizedCategory }
    
    const { data, error } = await supabase.from('channels').insert([newChannel]).select().single()
    
    if (error) {
      console.error('❌ Error al agregar canal:', error)
      return { success: false, message: 'Error al guardar en la base de datos' }
    }
    
    setChannels(prev => [data, ...prev])
    return { success: true, message: 'Canal agregado exitosamente' }
  }

  const removeChannel = async (id: string) => {
    if (!id) return
    const { error } = await supabase.from('channels').delete().eq('id', id)
    if (!error) {
      setChannels(prev => prev.filter(c => c.id !== id))
    }
  }

  // ✅ NUEVA FUNCIÓN: Actualizar URL, grupo o nombre del canal
  const updateChannel = async (id: string, updates: Partial<Pick<Channel, 'url' | 'group' | 'name'>>) => {
    if (!id) return { success: false, message: 'ID inválido' }
    
    const updateData: any = {}
    if (updates.url !== undefined && updates.url.trim()) updateData.url = updates.url.trim()
    if (updates.group !== undefined) updateData.group = updates.group.trim() || null
    if (updates.name !== undefined && updates.name.trim()) updateData.name = updates.name.trim()

    if (Object.keys(updateData).length === 0) {
      return { success: false, message: 'No hay cambios para guardar' }
    }

    const { data, error } = await supabase
      .from('channels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error al actualizar canal:', error)
      return { success: false, message: 'Error al actualizar' }
    }

    if (data) {
      setChannels(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
      return { success: true, message: 'Canal actualizado exitosamente' }
    }

    return { success: false, message: 'Error desconocido' }
  }

  const importM3U = async (content: string, category: string) => {
    const normalizedCategory = (category || 'movies').toLowerCase().trim()
    const lines = content.split('\n')
    const newChannels: any[] = []
    let currentName = 'Canal'
    let currentLogo = ''
    let currentGroup = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,([^,]+)$/i)
        const logoMatch = line.match(/tvg-logo="([^"]*)"/i)
        const groupMatch = line.match(/group-title="([^"]*)"/i)
        currentName = nameMatch ? nameMatch[1].trim() : 'Canal'
        currentLogo = logoMatch ? logoMatch[1] : ''
        currentGroup = groupMatch ? groupMatch[1] : ''
      } else if (line && !line.startsWith('#') && line.startsWith('http')) {
        newChannels.push({
          name: currentName,
          url: line,
          logo: currentLogo || null,
          group: currentGroup || null,
          category: normalizedCategory
        })
        currentName = 'Canal'
        currentLogo = ''
        currentGroup = ''
      }
    }

    if (newChannels.length === 0) return 0

    const { data, error } = await supabase.from('channels').insert(newChannels).select()
    if (error) {
      console.error('❌ Error importando M3U:', error)
      return 0
    }

    if (data) {
      setChannels(prev => [...data, ...prev])
      return data.length
    }
    return 0
  }

  return (
    <ContentContext.Provider value={{ 
      channels, movies, loading, refreshData: loadData, 
      addChannel, removeChannel, updateChannel, importM3U 
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
