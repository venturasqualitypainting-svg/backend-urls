import { useState } from 'react'
import { Settings, Lock, LogOut, Shield, Eye, EyeOff, Key, AlertCircle, CheckCircle, Upload, Sparkles, Baby, Trophy, Film, BookOpen, Crown, X, Copy, Trash2, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'

interface StreamCheck {
  url: string
  name: string
  logo?: string
  group?: string
  status: 'checking' | 'online' | 'offline' | 'error'
  message?: string
}

type Category = 'kids' | 'deportes' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico' | 'movies'

const categories = [
  { id: 'movies' as Category, name: 'Movies & Series', icon: Film, color: 'purple' },
  { id: 'kids' as Category, name: 'Kids', icon: Baby, color: 'cyan' },
  { id: 'deportes' as Category, name: 'Deportes', icon: Trophy, color: 'yellow' },
  { id: 'entretenimiento' as Category, name: 'Entretenimiento', icon: Film, color: 'orange' },
  { id: 'historia' as Category, name: 'Historia', icon: BookOpen, color: 'blue' },
  { id: 'premium' as Category, name: 'Premium', icon: Crown, color: 'amber' },
  { id: 'cineclasico' as Category, name: 'Cine Clásico', icon: Film, color: 'brown' }
]

export default function SettingsPanel() {
  const { isAdmin, login, logout } = useAuth()
  const { importM3U, addChannel } = useContent()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [categoryUrls, setCategoryUrls] = useState<Record<Category, string>>({
    movies: '', kids: '', deportes: '', entretenimiento: '', historia: '', premium: '', cineclasico: ''
  })
  const [importingCategory, setImportingCategory] = useState<Category | null>(null)
  const [checkList, setCheckList] = useState('')
  const [checkResults, setCheckResults] = useState<StreamCheck[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [checkTargetCategory, setCheckTargetCategory] = useState<Category>('movies')

  const handleLogin = () => {
    setError('')
    setSuccess('')
    if (login(password)) {
      setSuccess('¡Bienvenido Administrador!')
      setPassword('')
    } else {
      setError('Contraseña incorrecta')
    }
  }

  const handleLogout = () => {
    logout()
    setSuccess('Sesión cerrada')
  }

  const handleImportCategory = async (categoryId: Category) => {
    const url = categoryUrls[categoryId]
    if (!url.trim()) return
    setImportingCategory(categoryId)
    setError('')
    setSuccess('')
    
    try {
      let content = ''
      if (url.startsWith('http')) {
        try {
          const response = await fetch(url)
          content = await response.text()
        } catch {
          addChannel({ name: `Canal ${categoryId}`, url: url.trim(), category: categoryId })
          setSuccess(`✅ Canal agregado en ${categoryId}`)
          setCategoryUrls({ ...categoryUrls, [categoryId]: '' })
          setImportingCategory(null)
          return
        }
      } else {
        content = url
      }

      const importedCount = importM3U(content, categoryId)
      if (importedCount > 0) {
        const categoryName = categories.find(c => c.id === categoryId)?.name || categoryId
        setSuccess(`✅ ${importedCount} canales importados en ${categoryName}`)
      } else {
        setError('No se encontraron canales válidos')
      }
      setCategoryUrls({ ...categoryUrls, [categoryId]: '' })
    } catch (err) {
      setError('Error al importar')
    } finally {
      setImportingCategory(null)
    }
  }

  const handleCheckStreams = async () => {
    if (!checkList.trim()) return
    setIsChecking(true)
    setCheckResults([])
    
    const lines = checkList.split('\n')
    const results: StreamCheck[] = []
    let currentName = ''
    let currentLogo = ''
    let currentGroup = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,([^,]+)$/i)
        const logoMatch = line.match(/tvg-logo="([^"]*)"/i)
        const groupMatch = line.match(/group-title="([^"]*)"/i)
        
        currentName = nameMatch ? nameMatch[1].trim() : ''
        currentLogo = logoMatch ? logoMatch[1] : ''
        currentGroup = groupMatch ? groupMatch[1] : ''
      } else if (line && !line.startsWith('#') && !line.startsWith('http')) {
        currentName = line
      } else if (line && (line.startsWith('http') || line.includes('.m3u8'))) {
        const cleanUrl = line
        const channelName = currentName || cleanUrl.split('/').pop() || 'Stream'
        
        results.push({ 
          url: cleanUrl, 
          name: channelName,
          logo: currentLogo,
          group: currentGroup,
          status: 'checking' 
        })
        setCheckResults([...results])
        
        try {
          const response = await fetch(cleanUrl, { method: 'GET', mode: 'cors', signal: AbortSignal.timeout(8000) })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          results[results.length - 1] = { ...results[results.length - 1], status: 'online', message: 'Stream funcionando' }
        } catch (err: any) {
          results[results.length - 1] = { ...results[results.length - 1], status: 'offline', message: err.message || 'No accesible' }
        }
        setCheckResults([...results])
        
        currentName = ''
        currentLogo = ''
        currentGroup = ''
      }
    }
    setIsChecking(false)
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setSuccess('✅ URL copiada')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Error al copiar')
    }
  }

  const handleRemoveOfflineUrl = (url: string) => {
    setCheckResults(checkResults.filter(result => result.url !== url))
  }

  const handleSaveWorkingStreams = () => {
    const workingStreams = checkResults.filter(result => result.status === 'online')
    if (workingStreams.length === 0) {
      setError('No hay streams funcionando')
      setTimeout(() => setError(''), 3000)
      return
    }
    const m3uContent = workingStreams.map(stream => {
      let extinf = '#EXTINF:-1'
      if (stream.logo) extinf += ` tvg-logo="${stream.logo}"`
      if (stream.group) extinf += ` group-title="${stream.group}"`
      extinf += `,${stream.name}`
      return `${extinf}\n${stream.url}`
    }).join('\n')
    const importedCount = importM3U(m3uContent, checkTargetCategory)
    const categoryName = categories.find(c => c.id === checkTargetCategory)?.name || checkTargetCategory
    setSuccess(`✅ ${importedCount} streams guardados en ${categoryName}`)
    setCheckResults([])
    setCheckList('')
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="px-4 md:px-12 py-8 max-w-[1920px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-[#E50914]"/>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Configuración</h2>
        </div>
        <p className="text-[#808080] text-sm">Panel de administración</p>
      </div>

      <div className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-md p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#E50914]/20 to-[#B00710]/20 rounded-lg flex items-center justify-center border border-[#E50914]/30">
            <Shield className="w-7 h-7 text-[#E50914]"/>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Panel de Administrador</h3>
            <p className="text-[#808080] text-sm">{isAdmin ? 'Tienes acceso completo' : 'Ingresa la contraseña'}</p>
          </div>
        </div>

        {!isAdmin ? (
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm text-[#808080] flex items-center gap-2">
                <Key className="w-4 h-4"/>Contraseña de Administrador
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Ingresa la contraseña..."
                  className="w-full px-4 py-3 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white pr-12"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080]">
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-[#E50914] text-sm bg-[#E50914]/10 border border-[#E50914]/30 rounded-md p-3">
                <AlertCircle className="w-4 h-4"/>{error}
              </div>
            )}
            <button onClick={handleLogin} disabled={!password} className="w-full py-3 bg-[#E50914] text-white rounded-md font-medium hover:bg-[#F40612] disabled:opacity-50 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4"/>Acceder como Administrador
            </button>
            <div className="bg-[#2F2F2F] border border-[#3F3F3F] rounded-md p-4">
              <p className="text-xs text-[#808080] flex items-center gap-2">
                <AlertCircle className="w-3 h-3"/>Contraseña demo: <code className="text-[#E50914] bg-[#E50914]/10 px-1.5 py-0.5 rounded font-mono">tunetv2026</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-md p-3">
              <CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-green-400 text-sm font-medium">Autenticado como Administrador</span>
            </div>
            {success && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-md p-3">
                <CheckCircle className="w-4 h-4"/>{success}
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#E50914]"/>Importar Contenido por Categoría
              </h4>
              <p className="text-[#808080] text-sm">Selecciona la categoría y pega la URL o contenido M3U</p>
              {categories.map((category) => {
                const Icon = category.icon
                const isImporting = importingCategory === category.id
                return (
                  <div key={category.id} className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#E50914]/10 rounded-md flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#E50914]"/>
                      </div>
                      <div>
                        <h5 className="text-white font-medium">{category.name}</h5>
                      </div>
                    </div>
                    <textarea
                      value={categoryUrls[category.id]}
                      onChange={(e) => setCategoryUrls({ ...categoryUrls, [category.id]: e.target.value })}
                      placeholder="Pega aquí la URL de la lista M3U o el contenido..."
                      rows={4}
                      className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm resize-none mb-3 font-mono"
                    />
                    <button
                      onClick={() => handleImportCategory(category.id)}
                      disabled={!categoryUrls[category.id].trim() || isImporting}
                      className="w-full py-2 bg-[#E50914] text-white rounded-md hover:bg-[#F40612] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isImporting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Importando...</> : <><Upload className="w-4 h-4"/>Importar en {category.name}</>}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4">
              <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400"/>Verificador de Streams
              </h4>
              <div className="bg-[#1F1F1F] border border-[#3F3F3F] rounded-md p-3 mb-3">
                <p className="text-white text-xs font-medium mb-1">📋 Instrucciones:</p>
                <ol className="text-[#808080] text-xs space-y-1 list-decimal list-inside">
                  <li>Pega tus URLs o lista M3U abajo</li>
                  <li>Haz clic en "Verificar Streams"</li>
                  <li>Selecciona la categoría destino donde quieres guardarlos</li>
                  <li>Haz clic en "Guardar Streams Funcionales"</li>
                </ol>
              </div>
              <textarea
                value={checkList}
                onChange={(e) => setCheckList(e.target.value)}
                placeholder="Pega URLs para verificar (una por línea)..."
                rows={5}
                className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm resize-none mb-3 font-mono"
              />
              <button
                onClick={handleCheckStreams}
                disabled={!checkList.trim() || isChecking}
                className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
              >
                {isChecking ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Verificando...</> : <><CheckCircle className="w-4 h-4"/>Verificar Streams</>}
              </button>

              {checkResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-white text-sm font-medium">Resultados:</h5>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-400">✓ {checkResults.filter(r => r.status === 'online').length} online</span>
                      <span className="text-[#E50914]">✗ {checkResults.filter(r => r.status === 'offline').length} offline</span>
                    </div>
                  </div>
                  {checkResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-3 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md p-3">
                      {result.status === 'checking' && <div className="w-5 h-5 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin"/>}
                      {result.status === 'online' && <CheckCircle className="w-5 h-5 text-green-400"/>}
                      {result.status === 'offline' && <X className="w-5 h-5 text-[#E50914]"/>}
                      {result.logo ? (
                        <img src={result.logo} alt={result.name} className="w-12 h-12 object-contain rounded bg-[#1a1a1a] p-1" onError={(e) => { e.currentTarget.style.display = 'none' }}/>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#E50914]/30 to-[#B00710]/30 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold text-center px-1 leading-tight">{result.name.substring(0, 12)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{result.name}</p>
                        {result.group && <p className="text-[#808080] text-xs truncate">{result.group}</p>}
                        <p className="text-[#808080] text-xs truncate">{result.url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.status === 'online' && (
                          <button onClick={() => handleCopyUrl(result.url)} className="p-1.5 bg-[#3F3F3F] hover:bg-[#4F4F4F] rounded" title="Copiar URL">
                            <Copy className="w-3.5 h-3.5 text-white"/>
                          </button>
                        )}
                        {result.status === 'offline' && (
                          <button onClick={() => handleRemoveOfflineUrl(result.url)} className="p-1.5 bg-[#E50914]/20 hover:bg-[#E50914]/40 rounded" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5 text-[#E50914]"/>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {checkResults.some(r => r.status === 'online') && !isChecking && (
                    <>
                      <div className="bg-[#1F1F1F] border border-[#3F3F3F] rounded-md p-3">
                        <label className="text-white text-sm font-medium mb-2 block">Guardar en categoría:</label>
                        <select
                          value={checkTargetCategory}
                          onChange={(e) => setCheckTargetCategory(e.target.value as Category)}
                          className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:outline-none focus:border-[#E50914]"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={handleSaveWorkingStreams} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-md font-medium flex items-center justify-center gap-2">
                        <Save className="w-5 h-5"/>Guardar Streams Funcionales
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="w-full py-3 bg-[#2F2F2F] text-[#E50914] border border-[#E50914]/30 rounded-md font-medium hover:bg-[#E50914]/10 flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4"/>Cerrar Sesión de Admin
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
