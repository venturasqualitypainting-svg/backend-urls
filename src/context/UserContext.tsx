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
    localStorage.setItem(`tunetv_share_${code}`, JSON.stringify({
      channels: config.customChannels,
      movies: config.customMovies,
      timestamp: Date.now()
    }))
    setUserConfig(config)
    return code
  }

  const importFromShareCode = async (code: string): Promise<boolean> => {
    const shareData = localStorage.getItem(`tunetv_share_${code}`)
    if (!shareData) return false
    try {
      const data = JSON.parse(shareData)
      const config = userConfig || { password: '', shareCode: '', customChannels: [], customMovies: [] }
      config.customChannels = [...new Set([...config.customChannels, ...data.channels])]
      config.customMovies = [...new Set([...config.customMovies, ...data.movies])]
      setUserConfig(config)
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
