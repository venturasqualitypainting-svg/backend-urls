import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthContextType {
  isAdmin: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const ADMIN_PASSWORD = 'tunetv2026'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('tunetv_admin') === 'true')

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      sessionStorage.setItem('tunetv_admin', 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAdmin(false)
    sessionStorage.removeItem('tunetv_admin')
  }

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
