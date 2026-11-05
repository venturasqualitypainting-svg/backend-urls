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

  const generateShareCode = async (): Promise<string> => {
    const contentData = localStorage.getItem('tunetv_content')
    if (!contentData) {
      throw new Error('No hay datos para compartir')
    }

    const content = JSON.parse(contentData)
    
    try {
      // POST al servidor con los datos
      const response = await fetch('https://onrender.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channels: content.channels || [],
          movies: content.movies || []
        })
      })

      if (!response.ok) {
        throw new Error('Error al generar código')
      }

      const data = await response.json()
      const code = data.code || data.codigo
      
      // Guardar el código en el config del usuario
      const config = userConfig || { password: '', shareCode: '', customChannels: [], customMovies: [] }
      config.shareCode = code
      setUserConfig(config)
      
      return code
    } catch (error) {
      console.error('Error generando código:', error)
      throw error
    }
  }

  const importFromShareCode = async (code: string): Promise<boolean> => {
    try {
      // GET al servidor con el código
      const response = await fetch(`https://onrender.com/${code}`)
      
      if (!response.ok) {
        return false
      }

      const data = await response.json()
      
      // Importar contenido
      const existingContent = localStorage.getItem('tunetv_content')
      let content = existingContent ? JSON.parse(existingContent) : { channels: [], movies: [] }
      
      // Fusionar canales (evitar duplicados por URL)
      const existingUrls = new Set(content.channels.map((c: any) => c.url))
      const newChannels = (data.channels || []).filter((c: any) => !existingUrls.has(c.url))
      content.channels = [...content.channels, ...newChannels]
      
      // Fusionar películas
      const existingMovieUrls = new Set(content.movies.map((m: any) => m.url))
      const newMovies = (data.movies || []).filter((m: any) => !existingMovieUrls.has(m.url))
      content.movies = [...content.movies, ...newMovies]
      
      localStorage.setItem('tunetv_content', JSON.stringify(content))
      
      return true
    } catch (error) {
      console.error('Error importando código:', error)
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
