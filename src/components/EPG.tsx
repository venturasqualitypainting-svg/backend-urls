import { useState, useEffect, useMemo } from 'react'
import { Search, Clock, Bell, BellRing, X, Tv, Calendar } from 'lucide-react'
import { useContent, Channel } from '../context/ContentContext'

interface Program {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  genre: string
}

interface EPGProps {
  category: string
  categoryTitle: string
  onPlay: (url: string, title: string) => void
}

const generateProgramsForChannel = (channel: Channel, date: Date): Program[] => {
  const programs: Program[] = []
  const channelSeed = channel.name.length + channel.id.charCodeAt(0)
  
  const programTemplates = [
    { title: 'Noticiero Matutino', genre: 'Noticias', duration: 60 },
    { title: 'Magazine de la Mañana', genre: 'Entretenimiento', duration: 120 },
    { title: 'Series Clásicas', genre: 'Series', duration: 60 },
    { title: 'Cine de la Tarde', genre: 'Películas', duration: 120 },
    { title: 'Deportes en Vivo', genre: 'Deportes', duration: 90 },
    { title: 'Documental', genre: 'Documentales', duration: 60 },
    { title: 'Telenovela', genre: 'Series', duration: 60 },
    { title: 'Noticiero Estelar', genre: 'Noticias', duration: 60 },
    { title: 'Cine Prime Time', genre: 'Películas', duration: 120 },
    { title: 'Late Night Show', genre: 'Entretenimiento', duration: 60 },
    { title: 'Música en Vivo', genre: 'Música', duration: 90 },
    { title: 'Infantil', genre: 'Kids', duration: 60 }
  ]

  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)
  
  let currentTime = new Date(startDate)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 1)
  
  let programIndex = 0
  
  while (currentTime < endDate) {
    const template = programTemplates[(channelSeed + programIndex) % programTemplates.length]
    const duration = template.duration
    const startTime = new Date(currentTime)
    const endTime = new Date(currentTime)
    endTime.setMinutes(endTime.getMinutes() + duration)
    
    programs.push({
      id: `${channel.id}-${programIndex}`,
      title: `${template.title} - ${channel.name}`,
      description: `Disfruta de ${template.title.toLowerCase()} en ${channel.name}. Un programa de ${template.genre.toLowerCase()} seleccionado especialmente para ti.`,
      startTime,
      endTime,
      genre: template.genre
    })
    
    currentTime = endTime
    programIndex++
  }
  
  return programs
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function EPG({ category, categoryTitle, onPlay }: EPGProps) {
  const { channels } = useContent()
  const categoryChannels = channels.filter(c => c.category === category)
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [reminders, setReminders] = useState<string[]>([])
  const [activeNotifications, setActiveNotifications] = useState<{ id: string; title: string; channelName: string }[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const saved = localStorage.getItem('tunetv_epg_reminders')
    if (saved) setReminders(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('tunetv_epg_reminders', JSON.stringify(reminders))
  }, [reminders])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      categoryChannels.forEach(channel => {
        const programs = generateProgramsForChannel(channel, selectedDate)
        programs.forEach(program => {
          if (reminders.includes(program.id)) {
            const diffMinutes = (program.startTime.getTime() - now.getTime()) / 60000
            if (diffMinutes >= 0 && diffMinutes < 1) {
              if (!activeNotifications.find(n => n.id === program.id)) {
                setActiveNotifications(prev => [...prev, {
                  id: program.id,
                  title: program.title,
                  channelName: channel.name
                }])
                setTimeout(() => {
                  setActiveNotifications(prev => prev.filter(n => n.id !== program.id))
                }, 10000)
              }
            }
          }
        })
      })
    }
    
    const interval = setInterval(checkReminders, 30000)
    checkReminders()
    return () => clearInterval(interval)
  }, [categoryChannels, selectedDate, reminders, activeNotifications])

  const timelineHours = useMemo(() => {
    const hours: Date[] = []
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)
    for (let i = 0; i < 24; i++) {
      const hour = new Date(start)
      hour.setHours(i)
      hours.push(hour)
    }
    return hours
  }, [selectedDate])

  const toggleReminder = (programId: string) => {
    setReminders(prev => 
      prev.includes(programId) 
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    )
  }

  const dismissNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filteredChannels = categoryChannels.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.group || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString()
  }

  const getProgramAtTime = (channel: Channel, time: Date): Program | null => {
    const programs = generateProgramsForChannel(channel, selectedDate)
    return programs.find(p => time >= p.startTime && time < p.endTime) || null
  }

  const getProgress = (program: Program, now: Date): number => {
    const total = program.endTime.getTime() - program.startTime.getTime()
    const elapsed = now.getTime() - program.startTime.getTime()
    return Math.max(0, Math.min(100, (elapsed / total) * 100))
  }

  const dateStr = selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="px-4 md:px-12 py-8">
      {activeNotifications.map(notif => (
        <div key={notif.id} className="fixed top-24 right-4 z-[9999] bg-gradient-to-r from-[#E50914] to-[#B00710] text-white p-4 rounded-lg shadow-2xl max-w-sm">
          <div className="flex items-start gap-3">
            <BellRing className="w-6 h-6 flex-shrink-0 animate-pulse"/>
            <div className="flex-1">
              <p className="font-bold text-sm">¡Programa empezando!</p>
              <p className="text-xs mt-1">{notif.title}</p>
              <p className="text-xs opacity-80 mt-0.5">en {notif.channelName}</p>
            </div>
            <button onClick={() => dismissNotification(notif.id)} className="text-white/70 hover:text-white">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Tv className="w-8 h-8 text-[#E50914]"/>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Guía de Canales</h2>
          </div>
          <p className="text-[#808080] text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4"/>
            <span className="capitalize">{dateStr}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() - 1)
                setSelectedDate(d)
              }}
              className="px-3 py-2 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm"
            >
              ← Ayer
            </button>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-2 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md text-sm font-medium"
            >
              Hoy
            </button>
            <button 
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() + 1)
                setSelectedDate(d)
              }}
              className="px-3 py-2 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm"
            >
              Mañana →
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]"/>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar canal o género..."
              className="pl-10 pr-4 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {filteredChannels.length === 0 ? (
        <div className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-md p-12 text-center">
          <Tv className="w-12 h-12 text-[#808080] mx-auto mb-3"/>
          <p className="text-[#808080]">No hay canales disponibles en esta categoría</p>
        </div>
      ) : (
        <div className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-md overflow-hidden">
          <div className="flex border-b border-[#2F2F2F] bg-[#141414] sticky top-0 z-10">
            <div className="w-48 md:w-64 flex-shrink-0 p-3 border-r border-[#2F2F2F]">
              <div className="flex items-center gap-2 text-[#808080] text-xs">
                <Clock className="w-4 h-4"/>
                <span className="font-medium">CANAL</span>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex min-w-max">
                {timelineHours.map((hour, idx) => {
                  const isNow = isSameDay(hour, currentTime) && hour.getHours() === currentTime.getHours()
                  return (
                    <div 
                      key={idx} 
                      className={`w-32 flex-shrink-0 p-3 border-r border-[#2F2F2F] text-center ${
                        isNow ? 'bg-[#E50914]/10' : ''
                      }`}
                    >
                      <span className={`text-xs font-medium ${isNow ? 'text-[#E50914]' : 'text-[#808080]'}`}>
                        {formatTime(hour)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {filteredChannels.map((channel) => {
              const currentProgram = getProgramAtTime(channel, currentTime)
              const progress = currentProgram ? getProgress(currentProgram, currentTime) : 0
              const allPrograms = generateProgramsForChannel(channel, selectedDate)
              
              return (
                <div key={channel.id} className="flex border-b border-[#2F2F2F] hover:bg-[#2F2F2F]/30 transition-colors">
                  <div className="w-48 md:w-64 flex-shrink-0 p-3 border-r border-[#2F2F2F] bg-[#141414] flex items-center gap-3">
                    {channel.logo && !channel.logo.startsWith('📺') ? (
                      <img src={channel.logo} alt={channel.name} className="w-10 h-10 rounded object-contain bg-black/30 p-1 flex-shrink-0"/>
                    ) : (
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-[#E50914] to-[#B00710] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{channel.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{channel.name}</p>
                      {channel.group && (
                        <p className="text-[#808080] text-xs truncate">{channel.group}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <div className="flex min-w-max">
                      {allPrograms.slice(0, 24).map((program) => {
                        const durationHours = (program.endTime.getTime() - program.startTime.getTime()) / (1000 * 60 * 60)
                        const widthPx = durationHours * 128
                        const isCurrent = currentProgram?.id === program.id
                        const hasReminder = reminders.includes(program.id)
                        const isPast = program.endTime < currentTime
                        
                        return (
                          <div
                            key={program.id}
                            style={{ width: `${widthPx}px` }}
                            className={`flex-shrink-0 p-2 border-r border-[#2F2F2F] cursor-pointer transition-all ${
                              isCurrent 
                                ? 'bg-[#E50914]/20 border-l-2 border-l-[#E50914]' 
                                : isPast 
                                  ? 'bg-[#141414]/50 opacity-60'
                                  : 'hover:bg-[#2F2F2F]/50'
                            }`}
                            onClick={() => {
                              if (!isPast) {
                                toggleReminder(program.id)
                              }
                            }}
                            title={`${program.title}\n${formatTime(program.startTime)} - ${formatTime(program.endTime)}\n${program.description}`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <p className={`text-xs font-medium truncate ${isCurrent ? 'text-white' : 'text-[#e5e5e5]'}`}>
                                {program.title.split(' - ')[0]}
                              </p>
                              {hasReminder && !isPast && (
                                <BellRing className="w-3 h-3 text-[#FFD700] flex-shrink-0"/>
                              )}
                            </div>
                            <p className="text-[10px] text-[#808080] truncate">
                              {formatTime(program.startTime)} - {formatTime(program.endTime)}
                            </p>
                            {isCurrent && (
                              <div className="mt-1.5">
                                <div className="w-full h-1 bg-[#2F2F2F] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#E50914] transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onPlay(channel.url, channel.name)
                                  }}
                                  className="mt-1.5 text-[10px] text-[#E50914] hover:text-white font-medium"
                                >
                                  ▶ Ver ahora
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#808080]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#E50914]/20 border-l-2 border-l-[#E50914]"/>
          <span>Programa actual</span>
        </div>
        <div className="flex items-center gap-2">
          <BellRing className="w-3 h-3 text-[#FFD700]"/>
          <span>Recordatorio activado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#141414]/50 opacity-60"/>
          <span>Programa pasado</span>
        </div>
      </div>
    </div>
  )
}
