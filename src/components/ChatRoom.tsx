import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, Users, Hash } from 'lucide-react'

interface Message {
  id: string
  user: string
  avatar: string
  text: string
  timestamp: Date
  type: 'text' | 'system'
  color: string
}

const avatarColors = ['from-[#E50914] to-[#B00710]', 'from-[#00D4FF] to-[#0099CC]', 'from-[#4CAF50] to-[#2E7D32]']
const botNames = ['Carlos_TV', 'María_Stream', 'Pedro_Cine']
const botMessages = ['¡Hola a todos!', '¿Qué canales están viendo?', '¡Buenas tardes! 👋']

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', user: 'Sistema', avatar: '🤖', text: '¡Bienvenido al chat de TuneTV!', timestamp: new Date(), type: 'system', color: 'from-gray-500 to-gray-600' }
  ])
  const [inputText, setInputText] = useState('')
  const [username] = useState('Usuario_' + Math.floor(Math.random() * 9999))
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!inputText.trim()) return
    const newMsg: Message = {
      id: Date.now().toString(),
      user: username,
      avatar: '😊',
      text: inputText.trim(),
      timestamp: new Date(),
      type: 'text',
      color: avatarColors[Math.floor(Math.random() * avatarColors.length)]
    }
    setMessages(prev => [...prev, newMsg])
    setInputText('')
  }

  return (
    <div className="px-4 md:px-12 py-8 max-w-[1920px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-[#E50914]"/>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Chat en Vivo</h2>
          </div>
          <p className="text-[#808080] text-sm">Comparte comentarios con la comunidad</p>
        </div>
        <div className="flex items-center gap-2 bg-[#2F2F2F] border border-[#3F3F3F] px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full"/>
          <Users className="w-4 h-4 text-[#808080]"/>
          <span className="text-[#B3B3B3] text-sm">20</span>
        </div>
      </div>

      <div className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2F2F2F] bg-[#141414] flex items-center gap-3">
          <Hash className="w-5 h-5 text-[#808080]"/>
          <div>
            <p className="text-white font-medium text-sm">sala-general</p>
            <p className="text-[#808080] text-xs">Comparte con la comunidad TuneTV</p>
          </div>
        </div>

        <div className="h-[450px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.type === 'system' ? 'justify-center' : ''}`}>
              {msg.type === 'system' ? (
                <div className="bg-[#2F2F2F] px-4 py-2 rounded-full">
                  <p className="text-[#808080] text-xs">{msg.text}</p>
                </div>
              ) : (
                <>
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${msg.color} flex items-center justify-center text-lg`}>
                    {msg.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`font-medium text-sm ${msg.user === username ? 'text-[#00D4FF]' : 'text-white'}`}>{msg.user}</span>
                      <span className="text-[10px] text-[#555]">{msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[#B3B3B3] text-sm">{msg.text}</p>
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef}/>
        </div>

        <div className="p-3 border-t border-[#2F2F2F] bg-[#141414]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={`Mensaje como ${username}...`}
              className="flex-1 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md px-4 py-2.5 text-white text-sm"
            />
            <button onClick={sendMessage} disabled={!inputText.trim()} className="p-2.5 bg-[#E50914] rounded-md text-white disabled:opacity-50">
              <Send className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
