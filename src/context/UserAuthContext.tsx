// src/context/UserAuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  name: string
}

interface UserAuthContextType {
  user: User | null
  loading: boolean
  isUserAdmin: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  deleteAccount: () => Promise<{ success: boolean; error?: string }>
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined)

const ADMIN_EMAIL = 'mistraviesos@hotmail.com'

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const savedUser = localStorage.getItem('tunetv_user')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          setUser(parsed)
        } catch (e) {
          localStorage.removeItem('tunetv_user')
        }
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  // ✅ CRITICAL: Explicitly and safely check for admin email
  const isUserAdmin = user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()

  const login = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim()
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('password', password)
        .single()

      if (error || !data) {
        return { success: false, error: 'Credenciales incorrectas' }
      }

      const userData = { id: data.id, email: data.email, name: data.name }
      setUser(userData)
      localStorage.setItem('tunetv_user', JSON.stringify(userData))
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Error de conexión' }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim()
      const { data, error } = await supabase
        .from('users')
        .insert([{ email: normalizedEmail, password, name }])
        .select()
        .single()

      if (error) {
        return { success: false, error: 'El correo ya está registrado o hubo un error' }
      }

      const userData = { id: data.id, email: data.email, name: data.name }
      setUser(userData)
      localStorage.setItem('tunetv_user', JSON.stringify(userData))
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Error de conexión' }
    }
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('tunetv_user')
  }

  const deleteAccount = async () => {
    if (!user) return { success: false, error: 'No hay usuario' }
    try {
      const { error } = await supabase.from('users').delete().eq('id', user.id)
      if (error) return { success: false, error: error.message }
      setUser(null)
      localStorage.removeItem('tunetv_user')
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Error de conexión' }
    }
  }

  return (
    <UserAuthContext.Provider value={{ user, loading, isUserAdmin, login, register, logout, deleteAccount }}>
      {children}
    </UserAuthContext.Provider>
  )
}

export function useUserAuth() {
  const context = useContext(UserAuthContext)
  if (!context) throw new Error('useUserAuth must be used within UserAuthProvider')
  return context
}