import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface UserConfig {
  password: string
  shareCode: string
  customChannels: string[]
  customMovies: string[]
}

interface UserContextType {
  userConfig: UserConfig | null
  setUserPassword: (password: string) => void
  removeUserPassword: () => void
  generateShareCode: () => string
  importFromShareCode: (code: string) => Promise<boolean>
  canAddContent: () => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)
const STORAGE_KEY = 'tunetv_user_config'

export function UserProvider({ children }: { children: ReactNode }) {
  const [userConfig, setUserConfig] = useState<UserConfig | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (userConfig) localStorage.setItem(STORAGE_KEY, JSON.stringify(userConfig))
  }, [userConfig])

  const setUserPassword = (password: string) => {
    const config = userConfig || { password: '', shareCode: '', customChannels: [], customMovies: [] }
    config.password = password
    setUserConfig(config)
  }

  const removeUserPassword = () => {
    if (!userConfig) return
    setUserConfig({ ...userConfig, password: '' })
  }

  const generateShareCode = (): string => {
    // Obtener todos los datos del usuario
    const contentData = localStorage.getItem('tunetv_content')
    const userData = localStorage.getItem('tunetv_user_config')
    
    if (!contentData) {
      alert('No hay datos para compartir. Agrega algunos canales primero.')
      return ''
    }

    // Crear objeto con todos los datos
    const shareData = {
      content: JSON.parse(contentData),
      user: userData ? JSON.parse(userData) : null,
      timestamp: Date.now(),
      version: '1.0'
    }

    // Codificar en base64
    const jsonString = JSON.stringify(shareData)
    const encoded = btoa(unescape(encodeURIComponent(jsonString)))
    
    // Guardar el código generado
    const config = userConfig || { password: '', shareCode: '', customChannels: [], customMovies: [] }
    config.shareCode = encoded
    setUserConfig(config)
    
    return encoded
  }

  const importFromShareCode = async (code: string): Promise<boolean> => {
    try {
      // Decodificar el código
      const decoded = decodeURIComponent(escape(atob(code.trim())))
      const shareData = JSON.parse(decoded)
      
      // Validar estructura
      if (!shareData.content || !shareData.content.channels) {
        return false
      }

      // Importar contenido
      const existingContent = localStorage.getItem('tunetv_content')
      let content = existingContent ? JSON.parse(existingContent) : { channels: [], movies: [] }
      
      // Fusionar canales (evitar duplicados por URL)
      const existingUrls = new Set(content.channels.map((c: any) => c.url))
      const newChannels = shareData.content.channels.filter((c: any) => !existingUrls.has(c.url))
      content.channels = [...content.channels, ...newChannels]
      
      // Fusionar películas
      const existingMovieUrls = new Set(content.movies.map((m: any) => m.url))
      const newMovies = shareData.content.movies.filter((m: any) => !existingMovieUrls.has(m.url))
      content.movies = [...content.movies, ...newMovies]
      
      localStorage.setItem('tunetv_content', JSON.stringify(content))
      
      return true
    } catch (error) {
      console.error('Error importing share code:', error)
      return false
    }
  }

  const canAddContent = (): boolean => userConfig !== null && userConfig.password !== ''

  return (
    <UserContext.Provider value={{ userConfig, setUserPassword, removeUserPassword, generateShareCode, importFromShareCode, canAddContent }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}
