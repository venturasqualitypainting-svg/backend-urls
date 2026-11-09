import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface UserConfig {
  password?: string
  shareCode?: string
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('tunetv_user_config')
    if (saved) {
      setUserConfig(JSON.parse(saved))
    }
  }, [])

  const saveConfig = (config: UserConfig) => {
    setUserConfig(config)
    localStorage.setItem('tunetv_user_config', JSON.stringify(config))
  }

  const setUserPassword = (password: string) => {
    saveConfig({ ...userConfig, password })
  }

  const removeUserPassword = () => {
    const newConfig = { ...userConfig }
    delete newConfig.password
    saveConfig(newConfig)
  }

  const generateShareCode = (): string => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    saveConfig({ ...userConfig, shareCode: code })
    return code
  }

  const importFromShareCode = async (code: string): Promise<boolean> => {
    const saved = localStorage.getItem('tunetv_user_config')
    if (saved) {
      const config = JSON.parse(saved)
      if (config.shareCode === code) {
        return true
      }
    }
    return false
  }

  const canAddContent = (): boolean => {
    return !!userConfig?.password
  }

  return (
    <UserContext.Provider value={{ 
      userConfig, 
      setUserPassword, 
      removeUserPassword, 
      generateShareCode, 
      importFromShareCode, 
      canAddContent 
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}
