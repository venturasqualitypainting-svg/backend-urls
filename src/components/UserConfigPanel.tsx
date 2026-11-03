import { useState } from 'react'
import { User, Lock, Key, Copy, Check, Share2, QrCode, X, Download, Upload } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useAuth } from '../context/AuthContext'

export default function UserConfigPanel() {
  const { userConfig, setUserPassword, removeUserPassword, generateShareCode, importFromShareCode, canAddContent } = useUser()
  const { isAdmin } = useAuth()
  
  const [password, setPassword] = useState(userConfig?.password || '')
  const [importCode, setImportCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [shareCode, setShareCode] = useState(userConfig?.shareCode || '')

  const handleSetPassword = () => {
    if (password.trim()) setUserPassword(password.trim())
  }

  const handleRemovePassword = () => {
    if (confirm('¿Estás seguro de que quieres eliminar tu contraseña?')) {
      removeUserPassword()
      setPassword('')
    }
  }

  const handleGenerateCode = () => {
    if (!canAddContent()) {
      alert('Primero debes configurar una contraseña')
      return
    }
    const code = generateShareCode()
    setShareCode(code)
  }

  const handleImportCode = async () => {
    if (!importCode.trim()) return
    const success = await importFromShareCode(importCode.trim().toUpperCase())
    if (success) {
      setImportStatus('success')
      setImportCode('')
      setTimeout(() => setImportStatus('idle'), 3000)
    } else {
      setImportStatus('error')
      setTimeout(() => setImportStatus('idle'), 3000)
    }
  }

  const handleExportData = () => {
    const data = localStorage.getItem('tunetv_content')
    if (!data) {
      alert('No hay datos para exportar')
      return
    }
    
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tunetv_backup_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        if (data.channels && data.movies) {
          localStorage.setItem('tunetv_content', content)
          alert('✅ Datos importados correctamente. Recargando página...')
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        } else {
          alert('❌ Archivo de backup inválido')
        }
      } catch (err) {
        alert('❌ Error al leer el archivo')
      }
    }
    reader.readAsText(file)
  }

  const handleCopyCode = async () => {
    if (!shareCode) return
    try {
      await navigator.clipboard.writeText(shareCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying:', error)
    }
  }

  return (
    <div className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#E50914]/20 to-[#B00710]/20 rounded-lg flex items-center justify-center border border-[#E50914]/30">
          <User className="w-6 h-6 text-[#E50914]"/>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Mi Cuenta</h3>
          <p className="text-[#808080] text-sm">{canAddContent() ? 'Cuenta configurada' : 'Configura tu cuenta'}</p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#E50914]"/>Contraseña Personal
        </h4>
        <div className="flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña personal..."
            className="flex-1 px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm"
          />
          <button onClick={handleSetPassword} disabled={!password.trim()} className="px-4 py-2 bg-[#E50914] text-white rounded-md hover:bg-[#F40612] disabled:opacity-50">
            Guardar
          </button>
        </div>
        {canAddContent() && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-green-400 text-xs flex items-center gap-1">
              <Check className="w-3 h-3"/>Contraseña configurada
            </p>
            <button onClick={handleRemovePassword} className="flex items-center gap-1 px-3 py-1.5 bg-[#2F2F2F] hover:bg-[#E50914] text-[#808080] hover:text-white rounded-md text-xs">
              <X className="w-3 h-3"/>Eliminar
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 pt-6 border-t border-[#2F2F2F]">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#E50914]"/>Compartir Programación
        </h4>
        {shareCode && (
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4 mb-3">
            <p className="text-[#808080] text-xs mb-2">Tu código:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-mono text-[#E50914] font-bold">{shareCode}</code>
              <button onClick={handleCopyCode} className="p-2 bg-[#2F2F2F] rounded-md hover:bg-[#3F3F3F]">
                {copied ? <Check className="w-5 h-5 text-green-400"/> : <Copy className="w-5 h-5 text-white"/>}
              </button>
            </div>
          </div>
        )}
        <button onClick={handleGenerateCode} className="w-full py-2 bg-[#2F2F2F] text-white rounded-md hover:bg-[#3F3F3F] flex items-center justify-center gap-2">
          <QrCode className="w-4 h-4"/>{shareCode ? 'Generar Nuevo Código' : 'Generar Código'}
        </button>
      </div>

      <div className="pt-6 border-t border-[#2F2F2F]">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#00D4FF]"/>Compartir entre Dispositivos
        </h4>
        <p className="text-[#808080] text-xs mb-3">
          ⚠️ Los códigos solo funcionan en este navegador. Para compartir entre dispositivos usa el backup:
        </p>
        
        <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4 mb-3">
          <p className="text-white text-sm font-medium mb-2">📤 Exportar mi programación:</p>
          <button 
            onClick={handleExportData}
            className="w-full py-2 bg-[#00D4FF] text-black rounded-md hover:bg-[#00B8D9] font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4"/>Descargar Backup
          </button>
          <p className="text-[#808080] text-xs mt-2">
            Descarga un archivo con todas tus URLs y configuración
          </p>
        </div>

        <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4">
          <p className="text-white text-sm font-medium mb-2">📥 Importar programación:</p>
          <label className="w-full py-2 bg-[#2F2F2F] text-white rounded-md hover:bg-[#3F3F3F] font-medium flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4"/>Seleccionar Archivo
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
          <p className="text-[#808080] text-xs mt-2">
            Carga el archivo de backup en otro dispositivo
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-6 pt-6 border-t border-[#2F2F2F]">
          <p className="text-[#808080] text-xs">
            <span className="text-[#E50914] font-medium">Nota:</span> Como administrador, tienes acceso completo al sistema.
          </p>
        </div>
      )}
    </div>
  )
}
