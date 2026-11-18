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

// ✅ AVATARES SVG PERSONALIZADOS CON ANIMACIONES
export const AVATARS = [
  // Avatar 1: Robot animado
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#357ABD;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#grad1)"/>
      <rect x="35" y="30" width="30" height="35" rx="5" fill="#fff"/>
      <circle cx="42" cy="42" r="4" fill="#4A90E2">
        <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="58" cy="42" r="4" fill="#4A90E2">
        <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite"/>
      </circle>
      <rect x="40" y="52" width="20" height="3" rx="1.5" fill="#4A90E2"/>
      <rect x="45" y="20" width="10" height="8" rx="2" fill="#fff"/>
      <circle cx="50" cy="24" r="2" fill="#4A90E2">
        <animate attributeName="cy" values="24;22;24" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `)}`,
  
  // Avatar 2: Alien animado
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#00D4FF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0099CC;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#grad2)"/>
      <ellipse cx="50" cy="50" rx="25" ry="30" fill="#fff"/>
      <ellipse cx="40" cy="45" rx="8" ry="10" fill="#00D4FF">
        <animate attributeName="ry" values="10;12;10" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="60" cy="45" rx="8" ry="10" fill="#00D4FF">
        <animate attributeName="ry" values="10;12;10" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <circle cx="40" cy="45" r="3" fill="#000"/>
      <circle cx="60" cy="45" r="3" fill="#000"/>
      <path d="M 40 60 Q 50 65 60 60" stroke="#00D4FF" stroke-width="2" fill="none"/>
      <line x1="30" y1="25" x2="25" y2="15" stroke="#fff" stroke-width="3"/>
      <line x1="70" y1="25" x2="75" y2="15" stroke="#fff" stroke-width="3"/>
      <circle cx="25" cy="15" r="3" fill="#fff">
        <animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite"/>
      </circle>
      <circle cx="75" cy="15" r="3" fill="#fff">
        <animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `)}`,
  
  // Avatar 3: Monstruo animado
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#CC5500;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#grad3)"/>
      <circle cx="50" cy="55" r="28" fill="#fff"/>
      <circle cx="40" cy="50" r="6" fill="#FF6B35">
        <animate attributeName="cy" values="50;48;50" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="60" cy="50" r="6" fill="#FF6B35">
        <animate attributeName="cy" values="50;48;50" dur="2s" repeatCount="indefinite"/>
      </circle>
      <path d="M 35 65 Q 50 75 65 65" stroke="#FF6B35" stroke-width="3" fill="none"/>
      <polygon points="35,30 40,20 45,30" fill="#fff"/>
      <polygon points="55,30 60,20 65,30" fill="#fff"/>
      <polygon points="45,30 50,20 55,30" fill="#fff"/>
    </svg>
  `)}`,
  
  // Avatar 4: Gato animado
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#654321;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#grad4)"/>
      <circle cx="50" cy="55" r="25" fill="#fff"/>
      <polygon points="30,35 35,20 40,35" fill="#fff"/>
      <polygon points="60,35 65,20 70,35" fill="#fff"/>
      <ellipse cx="42" cy="50" rx="4" ry="6" fill="#8B4513">
        <animate attributeName="ry" values="6;7;6" dur="4s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="58" cy="50" rx="4" ry="6" fill="#8B4513">
        <animate attributeName="ry" values="6;7;6" dur="4s" repeatCount="indefinite"/>
      </ellipse>
      <circle cx="42" cy="50" r="2" fill="#000"/>
      <circle cx="58" cy="50" r="2" fill="#000"/>
      <ellipse cx="50" cy="60" rx="3" ry="2" fill="#FFB6C1"/>
      <path d="M 45 63 Q 50 66 55 63" stroke="#8B4513" stroke-width="1.5" fill="none"/>
    </svg>
  `)}`,
  
  // Avatar 5: Perro animado
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#CC9900;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#grad5)"/>
      <circle cx="50" cy="55" r="25" fill="#fff"/>
      <ellipse cx="30" cy="40" rx="8" ry="12" fill="#fff" transform="rotate(-20 30 40)">
        <animateTransform attributeName="transform" type="rotate" values="-20 30 40;-25 30 40;-20 30 40" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="70" cy="40" rx="8" ry="12" fill="#fff" transform="rotate(20 70 40)">
        <animateTransform attributeName="transform" type="rotate" values="20 70 40;25 70 40;20 70 40" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      <circle cx="42" cy="50" r="5" fill="#000"/>
      <circle cx="58" cy="50" r="5" fill="#000"/>
      <circle cx="42" cy="48" r="2" fill="#fff"/>
      <circle cx="58" cy="48" r="2" fill="#fff"/>
      <ellipse cx="50" cy="60" rx="4" ry="3" fill="#000"/>
      <path d="M 45 65 Q 50 68 55 65" stroke="#000" stroke-width="2" fill="none"/>
    </svg>
  `)}`,
  
  // Avatar 6: Unicornio animado
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#C0A0E0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#9B7BB8;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#grad6)"/>
      <circle cx="50" cy="55" r="25" fill="#fff"/>
      <polygon points="50,15 45,30 55,30" fill="#FFD700">
        <animate attributeName="points" values="50,15 45,30 55,30;50,12 45,30 55,30;50,15 45,30 55,30" dur="2s" repeatCount="indefinite"/>
      </polygon>
      <circle cx="42" cy="50" r="4" fill="#C0A0E0">
        <animate attributeName="r" values="4;5;4" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="58" cy="50" r="4" fill="#C0A0E0">
        <animate attributeName="r" values="4;5;4" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <path d="M 40 62 Q 50 68 60 62" stroke="#C0A0E0" stroke-width="2" fill="none"/>
      <circle cx="35" cy="55" r="3" fill="#FFB6C1" opacity="0.6"/>
      <circle cx="65" cy="55" r="3" fill="#FFB6C1" opacity="0.6"/>
    </svg>
  `)}`
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
