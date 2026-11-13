import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Notification {
  id: string
  message: string
  timestamp: number
  readBy: string[]
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (message: string, userEmail: string) => void
  markAsRead: (id: string, userEmail: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('guest')

  useEffect(() => {
    const user = localStorage.getItem('tunetv_user')
    if (user) {
      const parsed = JSON.parse(user)
      setCurrentUserEmail(parsed.email || 'guest')
    }
    
    const saved = localStorage.getItem('tunetv_notifications')
    if (saved) {
      setNotifications(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tunetv_notifications', JSON.stringify(notifications))
  }, [notifications])

  const addNotification = (message: string, userEmail: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now(),
      readBy: [userEmail]
    }
    setNotifications(prev => [newNotif, ...prev])
  }

  const markAsRead = (id: string, email: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === id && !n.readBy.includes(email)) {
        return { ...n, readBy: [...n.readBy, email] }
      }
      return n
    }))
  }

  const unreadCount = notifications.filter(n => !n.readBy.includes(currentUserEmail)).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}
