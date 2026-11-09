import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  name?: string
}

interface UserAuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isUserAdmin: boolean
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined)

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('tunetv_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('password', password)
        .single()

      if (error || !data) {
        return { success: false, error: 'Email o contraseña incorrectos' }
      }

      const userData = { id: data.id, email: data.email, name: data.name }
      setUser(userData)
      localStorage.setItem('tunetv_user', JSON.stringify(userData))
      return { success: true }
    } catch (err) {
      console.error('Error en login:', err)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ 
          email: email.toLowerCase().trim(), 
          password, 
          name: name.trim() 
        }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Este email ya está registrado' }
        }
        console.error('Error al registrar:', error)
        return { success: false, error: 'Error al crear la cuenta' }
      }

      const userData = { id: data.id, email: data.email, name: data.name }
      setUser(userData)
      localStorage.setItem('tunetv_user', JSON.stringify(userData))
      return { success: true }
    } catch (err) {
      console.error('Error en register:', err)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('tunetv_user')
  }

  // El admin especial (dueño de la plataforma)
  const isUserAdmin = user?.email === 'admin@tunetv.com'

  return (
    <UserAuthContext.Provider value={{ user, loading, login, register, logout, isUserAdmin }}>
      {children}
    </UserAuthContext.Provider>
  )
}

export function useUserAuth() {
  const context = useContext(UserAuthContext)
  if (!context) throw new Error('useUserAuth must be used within UserAuthProvider')
  return context
}
