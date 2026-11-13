import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Profile {
  id: string
  name: string
  avatar: string
  isKids: boolean
}

export interface WatchHistory {
  id: string
  title: string
  url: string
  poster: string
  currentTime: number
  duration: number
  timestamp: number
}

interface ProfileContextType {
  profiles: Profile[]
  currentProfile: Profile | null
  watchHistory: WatchHistory[]
  parentalPin: string
  setCurrentProfile: (profile: Profile | null) => void
  addProfile: (name: string, isKids: boolean, avatar: string) => void
  removeProfile: (id: string) => void
  updateWatchHistory: (item: Omit<WatchHistory, 'timestamp'>) => void
  removeFromHistory: (id: string) => void
  setParentalPin: (pin: string) => void
  clearParentalPin: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

// ✅ AVATARES SEGUROS Y CONFIABLES (Nunca se rompen)
export const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kitty&backgroundColor=c0aede'
]

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([])
  const [parentalPin, setParentalPinState] = useState<string>('')

  useEffect(() => {
    const savedProfiles = localStorage.getItem('tunetv_profiles')
    const savedPin = localStorage.getItem('tunetv_parental_pin')
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles))
    } else {
      const defaultProfile: Profile = { id: '1', name: 'Principal', avatar: AVATARS[0], isKids: false }
      setProfiles([defaultProfile])
    }
    if (savedPin) setParentalPinState(savedPin)
  }, [])

  useEffect(() => {
    localStorage.setItem('tunetv_profiles', JSON.stringify(profiles))
  }, [profiles])

  useEffect(() => {
    if (currentProfile) {
      const savedHistory = localStorage.getItem('tunetv_history_' + currentProfile.id)
      setWatchHistory(savedHistory ? JSON.parse(savedHistory) : [])
    } else {
      setWatchHistory([])
    }
  }, [currentProfile])

  useEffect(() => {
    if (currentProfile) {
      localStorage.setItem('tunetv_history_' + currentProfile.id, JSON.stringify(watchHistory))
    }
  }, [watchHistory, currentProfile])

  useEffect(() => {
    localStorage.setItem('tunetv_parental_pin', parentalPin)
  }, [parentalPin])

  const addProfile = (name: string, isKids: boolean, avatar: string) => {
    if (profiles.length >= 4) return
    const newProfile: Profile = {
      id: Date.now().toString(),
      name,
      avatar: avatar || AVATARS[profiles.length % AVATARS.length],
      isKids
    }
    setProfiles(prev => [...prev, newProfile])
  }

  const removeProfile = (id: string) => {
    if (profiles.length <= 1) return
    setProfiles(prev => prev.filter(p => p.id !== id))
    localStorage.removeItem('tunetv_history_' + id)
    if (currentProfile?.id === id) setCurrentProfile(null)
  }

  const updateWatchHistory = (item: Omit<WatchHistory, 'timestamp'>) => {
    setWatchHistory(prev => {
      const filtered = prev.filter(h => h.id !== item.id)
      return [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 20)
    })
  }

  const removeFromHistory = (id: string) => {
    setWatchHistory(prev => prev.filter(h => h.id !== id))
  }

  const setParentalPin = (pin: string) => {
    if (/^\d{4}$/.test(pin)) setParentalPinState(pin)
  }

  const clearParentalPin = () => {
    setParentalPinState('')
  }

  return (
    <ProfileContext.Provider value={{
      profiles, currentProfile, watchHistory, parentalPin,
      setCurrentProfile, addProfile, removeProfile,
      updateWatchHistory, removeFromHistory, setParentalPin, clearParentalPin
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile must be used within ProfileProvider')
  return context
}
