import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UserProvider } from './context/UserContext'
import { ContentProvider, useContent } from './context/ContentContext'
import { UserAuthProvider, useUserAuth } from './context/UserAuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ProfileProvider, useProfile } from './context/ProfileContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Movies from './components/Movies'
import ChatRoom from './components/ChatRoom'
import VideoPlayer from './components/VideoPlayer'
import SettingsPanel from './components/Settings'
import ContentSection from './components/ContentSection'
import ShareAppModal from './components/ShareAppModal'
import UserConfigPanel from './components/UserConfigPanel'
import ProfileSelector from './components/ProfileSelector'
import ContinueWatchingRow from './components/ContinueWatchingRow'
import { Baby, Trophy, Film, BookOpen, Crown, Clapperboard } from 'lucide-react'

type Section = 'movieseries' | 'deportes' | 'kids' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico' | 'chat' | 'settings'

function AuthWall() {
  const { login, register } = useUserAuth()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const handleUserAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setIsAuthLoading(true)
    if (authMode === 'login') {
      const result = await login(email, password)
      if (!result.success) setAuthError(result.error || 'Error al iniciar sesión')
    } else {
      if (!name.trim()) { setAuthError('El nombre es obligatorio'); setIsAuthLoading(false); return }
      const result = await register(email, password, name)
      if (!result.success) setAuthError(result.error || 'Error al crear la cuenta')
    }
    setIsAuthLoading(false)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center"><UserIcon className="w-8 h-8 text-white" /></div>
      </div>
      <h3 className="text-2xl font-bold text-white text-center mb-2">{authMode === 'login' ? 'Bienvenido a TuneTV' : 'Crear Cuenta'}</h3>
      <p className="text-[#808080] text-center text-sm mb-6">{authMode === 'login' ? 'Inicia sesión para acceder a tu programación.' : 'Regístrate para crear y compartir tu propia programación.'}</p>
      <form onSubmit={handleUserAuth} className="space-y-4">
        {authMode === 'register' && (
          <div className="space-y-1">
            <label className="text-xs text-[#808080]">Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none" required={authMode === 'register'} />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs text-[#808080]">Correo Electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none" required />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#808080]">Contraseña</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none pr-12" required minLength={6} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-white text-xs">
              {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
            </button>
          </div>
        </div>
        {authError && (<div className="flex items-center gap-2 text-[#E50914] text-sm bg-[#E50914]/10 border border-[#E50914]/30 rounded-md p-3"><AlertCircle className="w-4 h-4" /> {authError}</div>)}
        <button type="submit" disabled={isAuthLoading} className="w-full py-3 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-bold text-sm transition-colors disabled:opacity-50">
          {isAuthLoading ? 'Procesando...' : authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); setEmail(''); setPassword(''); setName('') }} className="text-[#808080] hover:text-white text-sm transition-colors">
          {authMode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useUserAuth()
  const { isAdmin } = useAuth()
  const { channels } = useContent()
  const { currentProfile, setCurrentProfile } = useProfile()
  const [activeSection, setActiveSection] = useState<Section>('movieseries')
  const [currentStream, setCurrentStream] = useState<{ url: string; title: string; poster?: string; startTime?: number; index?: number; isLive?: boolean } | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const getCurrentCategoryChannels = () => {
    const categoryMap: Record<string, any> = { 'movieseries': 'movies', 'deportes': 'deportes', 'kids': 'kids', 'entretenimiento': 'entretenimiento', 'historia': 'historia', 'premium': 'premium', 'cineclasico': 'cineclasico' }
    const category = categoryMap[activeSection] || 'movies'
    return channels.filter(c => c.category === category).map(c => ({ url: c.url, title: c.name }))
  }
  
  const currentCategoryChannels = getCurrentCategoryChannels()
  const currentChannelIndex = currentStream?.index ?? 0

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (currentProfile?.isKids && activeSection !== 'kids') {
      setActiveSection('kids')
    }
  }, [currentProfile])

  if (loading) {
    return (<div className="min-h-screen bg-[#141414] flex items-center justify-center"><Loader2 className="w-10 h-10 text-[#E50914] animate-spin" /></div>)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1F1F1F] border border-[#2F2F2F] rounded-lg p-8 shadow-2xl"><AuthWall /></div>
      </div>
    )
  }

  if (!currentProfile) {
    return <ProfileSelector onProfileSelect={setCurrentProfile} />
  }

  return (
    <div className="min-h-screen bg-[#141414] text-[#e5e5e5]">
      <Header 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        setShowShareModal={setShowShareModal}
        scrolled={scrolled}
        currentProfile={currentProfile}
        onProfileChange={() => setCurrentProfile(null)}
      />

      <div className="h-16 md:h-20"/>

      <AnimatePresence>
        {currentStream && (
          <VideoPlayer
            key={currentStream.url + currentChannelIndex}
            url={currentStream.url}
            title={currentStream.title}
            poster={currentStream.poster}
            startTime={currentStream.startTime}
            isLive={currentStream.isLive}
            onClose={() => setCurrentStream(null)}
            channels={currentCategoryChannels}
            currentIndex={currentChannelIndex}
            onChannelChange={(index) => {
              if (index >= 0 && index < currentCategoryChannels.length) {
                const newChannel = currentCategoryChannels[index]
                setCurrentStream({ url: newChannel.url, title: newChannel.title, index, isLive: true })
              }
            }}
          />
        )}
      </AnimatePresence>

      <ShareAppModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />

      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'movieseries' && (
              <>
                <ContinueWatchingRow 
                  onPlay={(url, title, startTime) => setCurrentStream({ url, title, startTime, isLive: false })} 
                />
                <Movies onPlayMovie={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index, isLive: false })}/>
              </>
            )}
            {activeSection === 'deportes' && (
              <ContentSection onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index, isLive: true })} title="Deportes" icon={Trophy} iconColor="text-[#E50914]" borderColor="border-[#E50914]/50" gradientFrom="from-[#E50914]/30" gradientTo="to-[#B00710]/30" category="deportes" />
            )}
            {activeSection === 'kids' && (
              <ContentSection onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index, isLive: true })} title="Kids" icon={Baby} iconColor="text-[#00D4FF]" borderColor="border-[#00D4FF]/50" gradientFrom="from-[#00D4FF]/30" gradientTo="to-[#0099CC]/30" category="kids" />
            )}
            {activeSection === 'entretenimiento' && (
              <ContentSection onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index, isLive: true })} title="Entretenimiento" icon={Clapperboard} iconColor="text-[#FF6B35]" borderColor="border-[#FF6B35]/50" gradientFrom="from-[#FF6B35]/30" gradientTo="to-[#CC5500]/30" category="entretenimiento" />
            )}
            {activeSection === 'historia' && (
              <ContentSection onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index, isLive: true })} title="Historia" icon={BookOpen} iconColor="text-[#4A90E2]" borderColor="border-[#4A90E2]/50" gradientFrom="from-[#4A90E2]/30" gradientTo="to-[#2E5C8A]/30" category="historia" />
            )}
            {activeSection === 'premium' && (
              <ContentSection onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index, isLive: true })} title="Premium" icon={Crown} iconColor="text-[#FFD700]" borderColor="border-[#FFD700]/50" gradientFrom="from-[#FFD700]/30" gradientTo="to-[#CC9900]/30" category="premium" />
            )}
            {activeSection === 'cineclasico' && (
              <ContentSection onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index, isLive: true })} title="Cine Clásico" icon={Film} iconColor="text-[#8B4513]" borderColor="border-[#8B4513]/50" gradientFrom="from-[#8B4513]/30" gradientTo="to-[#654321]/30" category="cineclasico" />
            )}
            {activeSection === 'chat' && <ChatRoom/>}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <UserConfigPanel/>
                <SettingsPanel/>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  )
}

function App() {
  return (
    <UserAuthProvider>
      <AuthProvider>
        <UserProvider>
          <ContentProvider>
            <NotificationProvider>
              <ProfileProvider>
                <AppContent/>
              </ProfileProvider>
            </NotificationProvider>
          </ContentProvider>
        </UserProvider>
      </AuthProvider>
    </UserAuthProvider>
  )
}

export default App
