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
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const config = userConfig || { password: '', shareCode: '', customChannels: [], customMovies: [] }
    config.shareCode = code
    
    // Guardar los datos del contenido asociados al código
    const contentData = localStorage.getItem('tunetv_content')
    if (contentData) {
      localStorage.setItem(`tunetv_share_${code}`, contentData)
    }
    
    setUserConfig(config)
    return code
  }

  const importFromShareCode = async (code: string): Promise<boolean> => {
    const shareData = localStorage.getItem(`tunetv_share_${code}`)
    if (!shareData) return false
    
    try {
      const data = JSON.parse(shareData)
      
      // Importar contenido
      const existingContent = localStorage.getItem('tunetv_content')
      let content = existingContent ? JSON.parse(existingContent) : { channels: [], movies: [] }
      
      // Fusionar canales (evitar duplicados por URL)
      const existingUrls = new Set(content.channels.map((c: any) => c.url))
      const newChannels = data.channels.filter((c: any) => !existingUrls.has(c.url))
      content.channels = [...content.channels, ...newChannels]
      
      // Fusionar películas
      const existingMovieUrls = new Set(content.movies.map((m: any) => m.url))
      const newMovies = data.movies.filter((m: any) => !existingMovieUrls.has(m.url))
      content.movies = [...content.movies, ...newMovies]
      
      localStorage.setItem('tunetv_content', JSON.stringify(content))
      
      return true
    } catch {
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
