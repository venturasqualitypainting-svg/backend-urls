// src/components/UserConfigPanel.tsx
import { useState } from 'react'
import { User, Mail, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useUserAuth } from '../context/UserAuthContext'

export default function UserConfigPanel() {
  const { user } = useUserAuth()
  const [name, setName] = useState(user?.name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage('')
    
    // Simulate save or actual update logic if available in your auth context
    setTimeout(() => {
      setIsSaving(false)
      setMessage('✅ Perfil actualizado correctamente')
      setTimeout(() => setMessage(''), 3000)
    }, 1000)
  }

  if (!user) return null

  return (
    <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#E50914]/10 rounded-lg flex items-center justify-center">
          <User className="w-6 h-6 text-[#E50914]" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Configuración de Perfil</h3>
          <p className="text-[#808080] text-sm">Administra tu información personal</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <div className="space-y-1">
          <label className="text-xs text-[#808080] flex items-center gap-2">
            <User className="w-4 h-4" /> Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none transition-colors"
            placeholder="Tu nombre"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[#808080] flex items-center gap-2">
            <Mail className="w-4 h-4" /> Correo Electrónico
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#3F3F3F] rounded-md text-[#808080] text-sm cursor-not-allowed"
          />
          <p className="text-[10px] text-[#808080]">El correo electrónico no se puede cambiar</p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
            ) : (
              <><Save className="w-4 h-4" /> Guardar Cambios</>
            )}
          </button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 text-sm rounded-md p-3 ${message.includes('✅') ? 'text-green-400 bg-green-500/10 border border-green-500/30' : 'text-[#E50914] bg-[#E50914]/10 border border-[#E50914]/30'}`}>
            {message.includes('✅') ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message}
          </div>
        )}
      </form>
    </div>
  )
}