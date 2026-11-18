import { useState } from 'react'
import { Settings, Lock, LogOut, Shield, Eye, EyeOff, AlertCircle, CheckCircle, Upload, Baby, Trophy, Film, BookOpen, Crown, X, Copy, Trash2, Save, Sparkles, Plus, User as UserIcon, Mail, Hash, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'
import { useUserAuth } from '../context/UserAuthContext'
import { useProfile } from '../context/ProfileContext'

interface StreamCheck {
  url: string
  name: string
  logo?: string
  group?: string
  status: 'checking' | 'online' | 'offline' | 'error'
  message?: string
  detectedCategory?: string
}

type Category = 'movies' | 'kids' | 'deportes' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico' | 'adultos'

const categories = [
  { id: 'movies' as Category, name: 'Movies & Series', icon: Film },
  { id: 'kids' as Category, name: 'Kids', icon: Baby },
  { id: 'deportes' as Category, name: 'Deportes', icon: Trophy },
  { id: 'entretenimiento' as Category, name: 'Entretenimiento', icon: Film },
  { id: 'historia' as Category, name: 'Historia', icon: BookOpen },
  { id: 'premium' as Category, name: 'Premium', icon: Crown },
  { id: 'cineclasico' as Category, name: 'Cine Clásico', icon: Film },
  { id: 'adultos' as Category, name: 'Adultos', icon: Film }
]

const detectCategory = (name: string, group: string): Category => {
  const text = (name + ' ' + group).toLowerCase()
  if (text.match(/\b(adulto|adult|xxx|erotic|porno|porn|playboy|hustler|penthouse)\b/)) return 'adultos'
  if (text.match(/\b(deporte|sport|espn|fox sport|tyc|directv|bein|dazn|gol|liga|nba|nfl|mlb|ufc|f1|tenis|tennis|copa|mundial|uefa|champions|premier|bundesliga|mls|futbol|football|soccer)\b/)) return 'deportes'
  if (text.match(/\b(kid|niño|niña|infantil|cartoon|disney|nick|nickelodeon|baby|boomerang|paka|children|kids)\b/)) return 'kids'
  if (text.match(/\b(historia|history|documental|documentary|discovery|national geographic|natgeo|animal planet|ciencia|science|war|arqueolog)\b/)) return 'historia'
  if (text.match(/\b(clásic|classic|retro|oldies|golden age|dorada|clasico|cine de oro)\b/)) return 'cineclasico'
  if (text.match(/\b(premium|hbo|max|star|paramount|apple tv|netflix|prime|showtime|cinemax|amc|fx|tnt|warner)\b/)) return 'premium'
  if (text.match(/\b(entretenimiento|entertainment|variety|comedy|comedia|reality|telenovela|novela|series|serie|telefe|televisa|azteca|magazine|late night|mtv|vh1)\b/)) return 'entretenimiento'
  return 'movies'
}

export default function SettingsPanel() {
  const { isAdmin: legacyIsAdmin } = useAuth()
  const { user, login, register, logout: userLogout, deleteAccount, isUserAdmin } = useUserAuth()
  const { importM3U, addChannel, addMovie, refreshData, categoryCounts } = useContent()
  const { parentalPin, setParentalPin, clearParentalPin } = useProfile()

  const isAdmin = legacyIsAdmin || isUserAdmin

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const [pinInput, setPinInput] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')

  const [categoryUrls, setCategoryUrls] = useState<Record<Category, string>>({
    movies: '', kids: '', deportes: '', entretenimiento: '', historia: '', premium: '', cineclasico: '', adultos: ''
  })
  const [importingCategory, setImportingCategory] = useState<Category | null>(null)

  const [checkList, setCheckList] = useState('')
  const [checkResults, setCheckResults] = useState<StreamCheck[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [checkTargetCategory, setCheckTargetCategory] = useState<Category>('deportes')
  const [autoDetect, setAutoDetect] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [newMovie, setNewMovie] = useState({
    title: '', url: '', poster: '', description: '', rating: '7.5',
    category: 'movies' as Category, genre: 'Movies'
  })
  const [episodes, setEpisodes] = useState<{ title: string, url: string }[]>([{ title: 'Episodio 1', url: '' }])
  const [isAddingMovie, setIsAddingMovie] = useState(false)

  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSetPin = () => {
    if (/^\d{4}$/.test(pinInput)) {
      setParentalPin(pinInput)
      setPinSuccess('PIN configurado correctamente')
      setPinInput('')
      setTimeout(() => setPinSuccess(''), 3000)
    } else {
      setError('El PIN debe ser exactamente 4 digitos numericos')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleClearPin = () => {
    clearParentalPin()
    setPinSuccess('PIN eliminado')
    setTimeout(() => setPinSuccess(''), 3000)
  }

  const handleUserAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setIsAuthLoading(true)
    if (authMode === 'login') {
      const result = await login(email, password)
      if (!result.success) setAuthError(result.error || 'Error al iniciar sesion')
      else { setEmail(''); setPassword('') }
    } else {
      if (!name.trim()) { setAuthError('El nombre es obligatorio'); setIsAuthLoading(false); return }
      const result = await register(email, password, name)
      if (!result.success) setAuthError(result.error || 'Error al crear la cuenta')
      else { setEmail(''); setPassword(''); setName('') }
    }
    setIsAuthLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setNewMovie({ ...newMovie, poster: reader.result as string })
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setNewMovie({ ...newMovie, poster: reader.result as string })
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMovie.title) { setError('El titulo es obligatorio'); return }
    const isSeries = newMovie.genre === 'Series'
    if (isSeries && episodes.length > 0 && !episodes[0].url) {
      setError('Agrega al menos una URL de episodio')
      return
    }
    if (!isSeries && !newMovie.url) {
      setError('La URL del stream es obligatoria')
      return
    }
    setIsAddingMovie(true)
    try {
      await addMovie({
        title: newMovie.title,
        url: isSeries ? (episodes[0]?.url || '') : newMovie.url,
        poster: newMovie.poster || undefined,
        description: newMovie.description || undefined,
        rating: parseFloat(newMovie.rating) || 7.5,
        year: new Date().getFullYear(),
        genre: newMovie.genre,
        category: newMovie.category,
        episodes: isSeries ? episodes : undefined
      })
      setSuccess('"' + newMovie.title + '" agregado exitosamente')
      setNewMovie({ title: '', url: '', poster: '', description: '', rating: '7.5', category: 'movies', genre: 'Movies' })
      setEpisodes([{ title: 'Episodio 1', url: '' }])
    } catch (err: any) {
      setError('Error al guardar: ' + (err.message || 'revisa la consola'))
    } finally {
      setIsAddingMovie(false)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleImportCategory = async (categoryId: Category) => {
    const url = categoryUrls[categoryId]
    if (!url.trim()) return
    if (importingCategory) return
    setImportingCategory(categoryId)
    setError('')
    setSuccess('')
    try {
      let content = ''
      if (url.startsWith('http') && (url.includes('.m3u') || url.includes('get.php') || url.endsWith('.txt'))) {
        try {
          const response = await fetch(url)
          content = await response.text()
        } catch {
          const result = await addChannel({ name: 'Canal ' + categoryId, url: url.trim(), category: categoryId })
          setSuccess(result.message)
          setCategoryUrls({ ...categoryUrls, [categoryId]: '' })
          setImportingCategory(null)
          return
        }
      } else if (url.startsWith('http') && !url.includes('\n') && url.includes('.m3u8')) {
        const result = await addChannel({ name: 'Canal ' + categoryId, url: url.trim(), category: categoryId })
        setSuccess(result.message)
        setCategoryUrls({ ...categoryUrls, [categoryId]: '' })
        setImportingCategory(null)
        return
      } else {
        content = url
      }
      const importedCount = await importM3U(content, categoryId)
      if (importedCount > 0) {
        const categoryName = categories.find(c => c.id === categoryId)?.name || categoryId
        setSuccess(importedCount + ' canales nuevos importados en ' + categoryName)
      } else {
        setSuccess('No se encontraron canales nuevos (todos ya existen)')
      }
      setCategoryUrls({ ...categoryUrls, [categoryId]: '' })
    } catch (err) {
      setError('Error al importar')
    } finally {
      setImportingCategory(null)
      setTimeout(() => { setSuccess(''); setError('') }, 5000)
    }
  }

  const handleRefreshData = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
      setSuccess('Datos recargados desde Supabase')
    } catch (err) {
      setError('Error al recargar datos')
    } finally {
      setIsRefreshing(false)
      setTimeout(() => { setSuccess(''); setError('') }, 3000)
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
        const nameMatch = line.match(/,([^,]+)$/)
        const logoMatch = line.match(/tvg-logo="([^"]*)"/)
        const groupMatch = line.match(/group-title="([^"]*)"/)
        currentName = nameMatch ? nameMatch[1].trim() : ''
        currentLogo = logoMatch ? logoMatch[1] : ''
        currentGroup = groupMatch ? groupMatch[1] : ''
      } else if (line && !line.startsWith('#') && !line.startsWith('http')) {
        currentName = line
      } else if (line && line.startsWith('http')) {
        const cleanUrl = line
        const channelName = currentName || cleanUrl.split('/').pop() || 'Stream'
        const detected = detectCategory(channelName, currentGroup)

        results.push({ url: cleanUrl, name: channelName, logo: currentLogo, group: currentGroup, status: 'checking', detectedCategory: detected })
        setCheckResults([...results])

        try {
          const response = await fetch(cleanUrl, { method: 'GET', mode: 'cors', signal: AbortSignal.timeout(8000) })
          if (!response.ok) throw new Error('HTTP ' + response.status)
          results[results.length - 1] = { ...results[results.length - 1], status: 'online', message: 'Stream funcionando' }
        } catch (err: any) {
          try {
            await fetch(cleanUrl, { method: 'GET', mode: 'no-cors', signal: AbortSignal.timeout(8000) })
            results[results.length - 1] = { ...results[results.length - 1], status: 'online', message: 'Alcanzable (CORS bloqueado, normal en IPTV)' }
          } catch (e) {
            results[results.length - 1] = { ...results[results.length - 1], status: 'offline', message: 'No accesible' }
          }
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
      setSuccess('URL copiada')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Error al copiar')
    }
  }

  const handleRemoveResult = (url: string) => setCheckResults(checkResults.filter(r => r.url !== url))

  const handleSaveWorkingStreams = async () => {
    const working = checkResults.filter(r => r.status === 'online')
    if (working.length === 0) {
      setError('No hay streams funcionando')
      setTimeout(() => setError(''), 3000)
      return
    }
    setIsChecking(true)
    const grouped: Record<string, typeof working> = {}
    working.forEach(stream => {
      const cat = autoDetect ? (stream.detectedCategory || 'movies') : checkTargetCategory
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(stream)
    })
    let totalSaved = 0
    const summary: string[] = []
    try {
      for (const [categoryId, streams] of Object.entries(grouped)) {
        const m3u = streams.map(s => {
          let extinf = '#EXTINF:-1'
          if (s.logo) extinf += ' tvg-logo="' + s.logo + '"'
          if (s.group) extinf += ' group-title="' + s.group + '"'
          extinf += ',' + s.name
          return extinf + '\n' + s.url
        }).join('\n')
        const count = await importM3U(m3u, categoryId as Category)
        totalSaved += count
        if (count > 0) {
          const catName = categories.find(c => c.id === categoryId)?.name || categoryId
          summary.push(count + ' en ' + catName)
        }
      }
      if (totalSaved > 0) {
        setSuccess(totalSaved + ' streams guardados: ' + summary.join(', '))
        setCheckResults([])
        setCheckList('')
        await refreshData()
      } else {
        setSuccess('No se guardaron streams nuevos (todos ya existen)')
      }
    } catch (err) {
      setError('Error de conexion al guardar')
    } finally {
      setIsChecking(false)
      setTimeout(() => { setSuccess(''); setError('') }, 5000)
    }
  }

  const onlineStreams = checkResults.filter(r => r.status === 'online')
  const totalChannels = Object.values(categoryCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="px-4 md:px-12 py-8 max-w-[1920px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-[#E50914]"/>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Configuracion</h2>
        </div>
        <p className="text-[#808080] text-sm">Panel de administracion y cuenta de usuario</p>
      </div>

      {!user ? (
        <div className="max-w-md mx-auto">
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              {authMode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}
            </h3>
            <form onSubmit={handleUserAuth} className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs text-[#808080]">Nombre</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none" required={authMode === 'register'} />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Correo Electronico</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Contrasena</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none pr-12" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-white">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {authError && (<div className="flex items-center gap-2 text-[#E50914] text-sm bg-[#E50914]/10 border border-[#E50914]/30 rounded-md p-3"><AlertCircle className="w-4 h-4" /><span>{authError}</span></div>)}
              <button type="submit" disabled={isAuthLoading} className="w-full py-3 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {isAuthLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (authMode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta')}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }} className="text-[#808080] hover:text-white text-sm">
                {authMode === 'login' ? 'No tienes cuenta? Registrate' : 'Ya tienes cuenta? Inicia sesion'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#E50914] to-[#B00710] rounded-full flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user?.name || 'Usuario'}</h3>
                <p className="text-[#808080] text-sm">{user?.email}</p>
                {isAdmin && (<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E50914]/20 text-[#E50914] text-xs font-bold rounded-full mt-1"><Shield className="w-3 h-3" /> Administrador</span>)}
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={userLogout} className="flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2 bg-[#2F2F2F] hover:bg-[#444444] text-white rounded-md text-sm font-medium flex"><LogOut className="w-4 h-4" /> Cerrar Sesion</button>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h4 className="text-white font-bold text-lg">Estado de Canales en Supabase</h4>
                <p className="text-[#808080] text-xs mt-1">Total: {totalChannels} canales</p>
              </div>
              <button onClick={handleRefreshData} disabled={isRefreshing} className="px-4 py-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white rounded-md text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                <RefreshCw className={'w-4 h-4 ' + (isRefreshing ? 'animate-spin' : '')} />
                {isRefreshing ? 'Recargando...' : 'Recargar Datos'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div key={cat} className="bg-[#1F1F1F] border border-[#3F3F3F] rounded-md p-3 text-center">
                  <p className="text-white text-2xl font-bold">{count}</p>
                  <p className="text-[#808080] text-xs capitalize mt-1">{cat}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#E50914]/10 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#E50914]" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Control Parental (PIN)</h4>
                <p className="text-[#808080] text-sm">Protege el acceso con un PIN de 4 digitos</p>
              </div>
            </div>
            {parentalPin ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-md p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 font-medium text-sm">PIN Activo</p>
                </div>
                <button onClick={handleClearPin} className="px-4 py-2 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md text-sm font-medium">Eliminar PIN</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="password" inputMode="numeric" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} placeholder="----" className="flex-1 px-4 py-3 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-center text-2xl tracking-widest focus:border-[#E50914] outline-none" />
                <button onClick={handleSetPin} disabled={pinInput.length !== 4} className="px-6 py-3 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-medium disabled:opacity-50">Configurar</button>
              </div>
            )}
            {pinSuccess && (<div className="mt-3 flex items-center gap-2 text-green-400 text-sm"><CheckCircle className="w-4 h-4"/>{pinSuccess}</div>)}
          </div>

          {success && (<div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-md p-3"><CheckCircle className="w-4 h-4"/>{success}</div>)}
          {error && (<div className="flex items-center gap-2 text-[#E50914] text-sm bg-[#E50914]/10 border border-[#E50914]/30 rounded-md p-3"><AlertCircle className="w-4 h-4"/>{error}</div>)}

          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4">
            <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400"/>Verificador de Streams
            </h4>
            <p className="text-[#808080] text-xs mb-3">
              Pega URLs o una lista M3U. Si un stream responde pero bloquea CORS (normal en IPTV), se marca como alcanzable.
            </p>
            <textarea value={checkList} onChange={(e) => setCheckList(e.target.value)} placeholder="Pega URLs para verificar..." rows={5} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm resize-none mb-3 font-mono"/>
            <button onClick={handleCheckStreams} disabled={!checkList.trim() || isChecking} className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-4">
              {isChecking ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Verificando...</>) : (<><CheckCircle className="w-4 h-4"/>Verificar Streams</>)}
            </button>

            {checkResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h5 className="text-white text-sm font-medium">Resultados:</h5>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-400">{onlineStreams.length} online</span>
                    <span className="text-[#E50914]">{checkResults.filter(r => r.status === 'offline').length} offline</span>
                  </div>
                </div>

                <div className="bg-[#1F1F1F] border border-[#3F3F3F] rounded-md p-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={autoDetect} onChange={(e) => setAutoDetect(e.target.checked)} disabled={!isAdmin} className="w-4 h-4 accent-[#E50914]"/>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400"/>Deteccion automatica de categorias
                      </p>
                      <p className="text-[#808080] text-xs">Desactivada por defecto. Solo el administrador puede activarla.</p>
                    </div>
                  </label>
                  {!autoDetect && (
                    <div className="mt-3 pt-3 border-t border-[#3F3F3F]">
                      <label className="text-white text-xs font-medium mb-2 block">Guardar TODO en categoria:</label>
                      <select value={checkTargetCategory} onChange={(e) => setCheckTargetCategory(e.target.value as Category)} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none">
                        {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                      </select>
                    </div>
                  )}
                </div>

                {checkResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md p-3">
                    {result.status === 'checking' && <div className="w-5 h-5 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin flex-shrink-0"/>}
                    {result.status === 'online' && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0"/>}
                    {result.status === 'offline' && <X className="w-5 h-5 text-[#E50914] flex-shrink-0"/>}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{result.name}</p>
                      <p className="text-[#808080] text-xs truncate">{result.url}</p>
                      {result.message && (<p className="text-[10px] text-yellow-400 mt-0.5">{result.message}</p>)}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {result.status === 'online' && (
                        <button onClick={() => handleCopyUrl(result.url)} className="p-1.5 bg-[#3F3F3F] hover:bg-[#4F4F4F] rounded" title="Copiar URL"><Copy className="w-3.5 h-3.5 text-white"/></button>
                      )}
                      <button onClick={() => handleRemoveResult(result.url)} className="p-1.5 bg-[#E50914]/20 hover:bg-[#E50914]/40 rounded" title="Quitar de la lista"><Trash2 className="w-3.5 h-3.5 text-[#E50914]"/></button>
                    </div>
                  </div>
                ))}

                {onlineStreams.length > 0 && !isChecking && (
                  <button onClick={handleSaveWorkingStreams} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-md font-medium flex items-center justify-center gap-2">
                    <Save className="w-5 h-5"/>Guardar {onlineStreams.length} Streams
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-6">
            <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-4"><Film className="w-5 h-5 text-[#E50914]"/>Agregar Pelicula o Serie</h4>
            <form onSubmit={handleAddMovie} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Titulo *</label>
                <input required type="text" value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Categoria</label>
                <select value={newMovie.category} onChange={e => setNewMovie({...newMovie, category: e.target.value as Category})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Genero</label>
                <select value={newMovie.genre} onChange={e => setNewMovie({...newMovie, genre: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none">
                  <option value="Movies">Movies</option>
                  <option value="Series">Series</option>
                  <option value="Documental">Documental</option>
                  <option value="Anime">Anime</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Calificacion</label>
                <input type="number" step="0.1" min="1" max="10" value={newMovie.rating} onChange={e => setNewMovie({...newMovie, rating: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" />
              </div>
              {newMovie.genre === 'Series' ? (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-[#808080]">Episodios</label>
                  {episodes.map((ep, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input placeholder="Titulo" value={ep.title} onChange={e => { const n = [...episodes]; n[idx].title = e.target.value; setEpisodes(n) }} className="flex-1 px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm outline-none" />
                      <input placeholder="URL" value={ep.url} onChange={e => { const n = [...episodes]; n[idx].url = e.target.value; setEpisodes(n) }} className="flex-[2] px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm outline-none" />
                      {episodes.length > 1 && (<button type="button" onClick={() => setEpisodes(episodes.filter((_, i) => i !== idx))} className="p-2 bg-[#E50914] text-white rounded-md"><Trash2 className="w-4 h-4" /></button>)}
                    </div>
                  ))}
                  <button type="button" onClick={() => setEpisodes([...episodes, { title: 'Episodio ' + (episodes.length + 1), url: '' }])} className="text-[#E50914] text-sm flex items-center gap-1 hover:underline"><Plus className="w-4 h-4" /> Agregar episodio</button>
                </div>
              ) : (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-[#808080]">URL del Stream *</label>
                  <input required type="url" value={newMovie.url} onChange={e => setNewMovie({...newMovie, url: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm outline-none" placeholder="https://ejemplo.com/stream.m3u8" />
                </div>
              )}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-[#808080]">Poster</label>
                <div className="flex items-start gap-4">
                  <label onDrop={handleDrop} onDragOver={handleDragOver} className="flex-1 cursor-pointer border-2 border-dashed border-[#3F3F3F] hover:border-[#E50914] rounded-md p-6 flex flex-col items-center justify-center bg-[#2F2F2F]">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <Upload className="w-8 h-8 text-[#808080] mb-2" />
                    <span className="text-xs text-[#808080] text-center">Arrastra o haz clic</span>
                  </label>
                  {newMovie.poster && (
                    <div className="relative w-24 h-36 rounded-md overflow-hidden bg-black border border-[#3F3F3F] flex-shrink-0">
                      <img src={newMovie.poster} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setNewMovie({ ...newMovie, poster: '' })} className="absolute top-1 right-1 bg-[#E50914] text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-[#808080]">Descripcion</label>
                <textarea value={newMovie.description} onChange={e => setNewMovie({...newMovie, description: e.target.value})} rows={3} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm outline-none resize-none" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={isAddingMovie} className="w-full py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {isAddingMovie ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Guardando...</>) : (<><Plus className="w-4 h-4"/>Agregar al Catalogo</>)}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg flex items-center gap-2"><Upload className="w-5 h-5 text-[#E50914]"/>Importar Contenido por Categoria</h4>
            {categories.map((category) => {
              const Icon = category.icon
              const isImporting = importingCategory === category.id
              return (
                <div key={category.id} className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#E50914]/10 rounded-md flex items-center justify-center"><Icon className="w-5 h-5 text-[#E50914]"/></div>
                    <h5 className="text-white font-medium">{category.name}</h5>
                  </div>
                  <textarea value={categoryUrls[category.id]} onChange={(e) => setCategoryUrls({ ...categoryUrls, [category.id]: e.target.value })} placeholder="Pega URL M3U o contenido..." rows={4} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm resize-none mb-3 font-mono" disabled={isImporting} />
                  <button onClick={() => handleImportCategory(category.id)} disabled={!categoryUrls[category.id].trim() || isImporting} className="w-full py-2 bg-[#E50914] text-white rounded-md hover:bg-[#F40612] disabled:opacity-50 flex items-center justify-center gap-2">
                    {isImporting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Importando...</>) : (<><Upload className="w-4 h-4"/>Importar en {category.name}</>)}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
