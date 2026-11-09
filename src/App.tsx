import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Trophy, MessageCircle, Menu, X, Settings, Baby, BookOpen, Crown, Clapperboard, Search, Bell, User, Share2 } from 'lucide-react'
import Movies from './components/Movies'
import ChatRoom from './components/ChatRoom'
import VideoPlayer from './components/VideoPlayer'
import SettingsPanel from './components/Settings'
import ContentSection from './components/ContentSection'
import TuneTVLogo from './components/TuneTVLogo'
import ShareAppModal from './components/ShareAppModal'
import UserConfigPanel from './components/UserConfigPanel'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UserProvider } from './context/UserContext'
import { ContentProvider, useContent } from './context/ContentContext'
import { UserAuthProvider } from './context/UserAuthContext' // 👈 NUEVO IMPORT AGREGADO

type Section = 'movieseries' | 'deportes' | 'kids' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico' | 'chat' | 'settings'

function AppContent() {
  const { isAdmin } = useAuth()
  const { channels } = useContent()
  const [activeSection, setActiveSection] = useState<Section>('movieseries')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentStream, setCurrentStream] = useState<{ url: string; title: string; index?: number } | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const getCurrentCategoryChannels = () => {
    const categoryMap: Record<string, any> = {
      'movieseries': 'movies',
      'deportes': 'deportes',
      'kids': 'kids',
      'entretenimiento': 'entretenimiento',
      'historia': 'historia',
      'premium': 'premium',
      'cineclasico': 'cineclasico'
    }
    
    const category = categoryMap[activeSection] || 'movies'
    
    return channels
      .filter(c => c.category === category)
      .map(c => ({ url: c.url, title: c.name }))
  }
  
  const currentCategoryChannels = getCurrentCategoryChannels()
  const currentChannelIndex = currentStream?.index ?? 0

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { id: 'movieseries' as Section, label: 'Movies & Series', icon: Film },
    { id: 'deportes' as Section, label: 'Deportes', icon: Trophy },
    { id: 'kids' as Section, label: 'Kids', icon: Baby },
    { id: 'entretenimiento' as Section, label: 'Entretenimiento', icon: Clapperboard },
    { id: 'historia' as Section, label: 'Historia', icon: BookOpen },
    { id: 'premium' as Section, label: 'Premium', icon: Crown },
    { id: 'cineclasico' as Section, label: 'Cine Clásico', icon: Film },
    { id: 'chat' as Section, label: 'Chat', icon: MessageCircle },
  ]

  return (
    <div className="min-h-screen bg-[#141414] text-[#e5e5e5]">
      <header 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
        style={{
          background: scrolled 
            ? '#141414' 
            : 'linear-gradient(to bottom, rgba(0,0,0,0.7) 10%, transparent)'
        }}
      >
        <div className="max-w-[1920px] mx-auto px-4 md:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3 flex-shrink-0">
              <TuneTVLogo size={44}/>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold tracking-wide">
                  <span className="text-white">TUNE</span>
                  <span className="text-[#E50914]">TV</span>
                </h1>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-5 overflow-x-auto hide-scrollbar">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap text-[14px] font-medium ${
                    activeSection === item.id
                      ? 'text-white bg-[#E50914] px-3 py-2 rounded-md font-bold'
                      : 'text-[#e5e5e5] hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4"/>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button className="hidden md:flex p-2 text-[#e5e5e5] hover:text-white transition-colors">
                <Search className="w-5 h-5"/>
              </button>
              <button 
                onClick={() => setShowShareModal(true)}
                className="hidden md:flex p-2 text-[#e5e5e5] hover:text-white transition-colors relative"
                title="Compartir aplicación"
              >
                <Share2 className="w-5 h-5"/>
              </button>
              <button className="hidden md:flex p-2 text-[#e5e5e5] hover:text-white transition-colors relative">
                <Bell className="w-5 h-5"/>
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#E50914] rounded-full"/>
              </button>
              <button
                onClick={() => setActiveSection('settings')}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  activeSection === 'settings'
                    ? 'bg-[#E50914] text-white'
                    : 'bg-white/10 text-[#e5e5e5] hover:text-white'
                }`}
              >
                <User className="w-4 h-4"/>
                <span className="text-sm font-medium">{isAdmin ? 'Admin' : 'Invitado'}</span>
              </button>

              <button className="lg:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="lg:hidden overflow-hidden bg-[#141414] border-t border-white/5"
              >
                <div className="py-3 space-y-1 max-h-[70vh] overflow-y-auto">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-md transition-all ${
                        activeSection === item.id
                          ? 'bg-[#E50914] text-white font-bold'
                          : 'text-[#e5e5e5] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-5 h-5"/>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                  <div className="border-t border-white/5 pt-2 mt-2">
                    <button
                      onClick={() => {
                        setShowShareModal(true)
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-md transition-all text-[#e5e5e5] hover:text-white hover:bg-white/5"
                    >
                      <Share2 className="w-5 h-5"/>
                      <span className="font-medium">Compartir App</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSection('settings')
                        setMobileMenuOpen(false)
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-md transition-all ${
                        activeSection === 'settings'
                          ? 'bg-[#E50914] text-white font-bold'
                          : 'text-[#e5e5e5] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Settings className="w-5 h-5"/>
                      <span className="font-medium">Configuración</span>
                      {isAdmin && <span className="ml-auto w-2 h-2 bg-green-400 rounded-full"/>}
                    </button>
                  </div>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="h-16 md:h-20"/>

      <AnimatePresence>
        {currentStream && (
          <VideoPlayer
            key={`${currentStream.url}-${currentChannelIndex}`}
            url={currentStream.url}
            title={currentStream.title}
            onClose={() => setCurrentStream(null)}
            channels={currentCategoryChannels}
            currentIndex={currentChannelIndex}
            onChannelChange={(index) => {
              if (index >= 0 && index < currentCategoryChannels.length) {
                const newChannel = currentCategoryChannels[index]
                setCurrentStream({ 
                  url: newChannel.url, 
                  title: newChannel.title,
                  index: index
                })
              }
            }}
          />
        )}
      </AnimatePresence>

      <ShareAppModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
      />

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
              <Movies onPlayMovie={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index })}/>
            )}
            {activeSection === 'deportes' && (
              <ContentSection
                onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index })}
                title="Deportes"
                icon={Trophy}
                iconColor="text-[#E50914]"
                borderColor="border-[#E50914]/50"
                gradientFrom="from-[#E50914]/30"
                gradientTo="to-[#B00710]/30"
                category="deportes"
              />
            )}
            {activeSection === 'kids' && (
              <ContentSection
                onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index })}
                title="Kids"
                icon={Baby}
                iconColor="text-[#00D4FF]"
                borderColor="border-[#00D4FF]/50"
                gradientFrom="from-[#00D4FF]/30"
                gradientTo="to-[#0099CC]/30"
                category="kids"
              />
            )}
            {activeSection === 'entretenimiento' && (
              <ContentSection
                onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index })}
                title="Entretenimiento"
                icon={Clapperboard}
                iconColor="text-[#FF6B35]"
                borderColor="border-[#FF6B35]/50"
                gradientFrom="from-[#FF6B35]/30"
                gradientTo="to-[#CC5500]/30"
                category="entretenimiento"
              />
            )}
            {activeSection === 'historia' && (
              <ContentSection
                onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index })}
                title="Historia"
                icon={BookOpen}
                iconColor="text-[#4A90E2]"
                borderColor="border-[#4A90E2]/50"
                gradientFrom="from-[#4A90E2]/30"
                gradientTo="to-[#2E5C8A]/30"
                category="historia"
              />
            )}
            {activeSection === 'premium' && (
              <ContentSection
                onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index })}
                title="Premium"
                icon={Crown}
                iconColor="text-[#FFD700]"
                borderColor="border-[#FFD700]/50"
                gradientFrom="from-[#FFD700]/30"
                gradientTo="to-[#CC9900]/30"
                category="premium"
              />
            )}
            {activeSection === 'cineclasico' && (
              <ContentSection
                onPlay={(url: string, title: string, index?: number) => setCurrentStream({ url, title, index })}
                title="Cine Clásico"
                icon={Film}
                iconColor="text-[#8B4513]"
                borderColor="border-[#8B4513]/50"
                gradientFrom="from-[#8B4513]/30"
                gradientTo="to-[#654321]/30"
                category="cineclasico"
              />
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

      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-[1920px] mx-auto px-4 md:px-12 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <TuneTVLogo size={32}/>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">TUNE</span>
                <span className="text-lg font-bold text-[#E50914]">TV</span>
              </div>
              <span className="text-sm text-[#808080] ml-2">© 2026</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#808080]">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Ayuda</a>
              <a href="#" className="hover:text-white transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <UserAuthProvider> {/* 👈 NUEVO WRAPPER AGREGADO AQUÍ */}
      <AuthProvider>
        <UserProvider>
          <ContentProvider>
            <AppContent/>
          </ContentProvider>
        </UserProvider>
      </AuthProvider>
    </UserAuthProvider>
  )
}

export default App