import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, Trophy, MessageCircle, Menu, X, Settings, Baby, BookOpen, Crown, Clapperboard, Search, Bell, User, Share2, Send } from 'lucide-react'
import TuneTVLogo from './TuneTVLogo'
import { useAuth } from '../context/AuthContext'
import { useUserAuth } from '../context/UserAuthContext'
import { useNotifications } from '../context/NotificationContext'

type Section = 'movieseries' | 'deportes' | 'kids' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico' | 'chat' | 'settings'

interface HeaderProps {
  activeSection: Section
  setActiveSection: (section: Section) => void
  setShowShareModal: (show: boolean) => void
  scrolled: boolean
}

export default function Header({ activeSection, setActiveSection, setShowShareModal, scrolled }: HeaderProps) {
  const { isAdmin } = useAuth()
  const { user, isUserAdmin } = useUserAuth()
  const { notifications, unreadCount, addNotification, markAsRead } = useNotifications()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [newNotifMsg, setNewNotifMsg] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAdminUser = isAdmin || isUserAdmin

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSendNotification = () => {
    if (!newNotifMsg.trim() || !user) return
    addNotification(newNotifMsg.trim(), user.email)
    setNewNotifMsg('')
    setShowNotifDropdown(false)
  }

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
    <header 
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
      style={{
        background: scrolled ? '#141414' : 'linear-gradient(to bottom, rgba(0,0,0,0.7) 10%, transparent)'
      }}
    >
      <div className="max-w-[1920px] mx-auto px-4 md:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => setActiveSection('movieseries')}>
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

          <div className="flex items-center gap-3 relative">
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
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown)
                  if (user && notifications.length > 0) {
                    notifications.forEach(n => markAsRead(n.id, user.email))
                  }
                }}
                className="hidden md:flex p-2 text-[#e5e5e5] hover:text-white transition-colors relative"
              >
                <Bell className="w-5 h-5"/>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#E50914] rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#141414]">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[#1F1F1F] border border-[#2F2F2F] rounded-md shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-[#2F2F2F] flex items-center justify-between">
                      <h3 className="text-white font-bold text-sm">Notificaciones</h3>
                      {isAdminUser && <span className="text-[10px] text-[#E50914] font-bold">ADMIN</span>}
                    </div>
                    
                    {isAdminUser && (
                      <div className="p-3 border-b border-[#2F2F2F] bg-[#141414]">
                        <textarea
                          value={newNotifMsg}
                          onChange={(e) => setNewNotifMsg(e.target.value)}
                          placeholder="Escribe un anuncio para todos los usuarios..."
                          className="w-full bg-[#2F2F2F] border border-[#3F3F3F] rounded-md p-2 text-white text-xs mb-2 resize-none focus:border-[#E50914] outline-none"
                          rows={2}
                        />
                        <button 
                          onClick={handleSendNotification}
                          disabled={!newNotifMsg.trim()}
                          className="w-full py-1.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Send className="w-3 h-3"/> Enviar Anuncio
                        </button>
                      </div>
                    )}

                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-[#808080] text-xs text-center">No hay notificaciones nuevas.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-3 border-b border-[#2F2F2F] hover:bg-[#2F2F2F]/50 transition-colors">
                            <p className="text-white text-sm mb-1">{notif.message}</p>
                            <p className="text-[#808080] text-[10px]">
                              {new Date(notif.timestamp).toLocaleString('es-ES')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setActiveSection('settings')}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                activeSection === 'settings'
                  ? 'bg-[#E50914] text-white'
                  : 'bg-white/10 text-[#e5e5e5] hover:text-white'
              }`}
            >
              <User className="w-4 h-4"/>
              <span className="text-sm font-medium">{user?.name || (isAdminUser ? 'Admin' : 'Invitado')}</span>
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
                    {isAdminUser && <span className="ml-auto w-2 h-2 bg-green-400 rounded-full"/>}
                  </button>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
