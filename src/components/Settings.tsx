import { useState } from 'react'
import { Settings, Lock, LogOut, Shield, Eye, EyeOff, Key, AlertCircle, CheckCircle, Upload, Baby, Trophy, Film, BookOpen, Crown, X, Copy, Trash2, Save, Sparkles, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'

interface StreamCheck {
  url: string
  name: string
  logo?: string
  group?: string
  status: 'checking' | 'online' | 'offline' | 'error'
  message?: string
  detectedCategory?: string
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

const detectCategory = (name: string, group: string): Category => {
  const text = `${name} ${group}`.toLowerCase()
  if (text.match(/\b(deporte|sport|espn|fox sport|tds|tyc|directv sport|fox sports|bein|dazn|gol|liga|nba|nfl|mlb|ufc|f1|formula 1|tenis|tennis|olimp|copa|mundial|uefa|champions|premier|la liga|serie a|bundesliga|mls|futbol|football|soccer)\b/)) return 'deportes'
  if (text.match(/\b(kid|niño|niña|infantil|cartoon|disney|nick|nickelodeon|baby|infant|disney junior|disney xd|disney channel|cartoon network|baby tv|once niñas|once kids|pac child|paka paka|zoom|jetix|boomerang|peque|peques|chico|chicos|children|kids)\b/)) return 'kids'
  if (text.match(/\b(historia|history|documental|documentary|discovery|national geographic|nat geo|natgeo|animal planet|investigation|crime|investigacion|militar|military|war|ciencia|science|space|explora|explorer|ancient|antigu|arqueolog)\b/)) return 'historia'
  if (text.match(/\b(clásic|classic|retro|antigu|viejo|oldies|golden age|epoca de oro|dorada|años 50|años 60|años 70|años 80|clasico|classics|cinema classico|cine de oro)\b/)) return 'cineclasico'
  if (text.match(/\b(premium|hbo|max|star|paramount|apple tv|netflix|amazon prime|disney\+|star\+|hbo max|hbomax|showtime|cinemax|studio universal|universal premium|fox premium|amc|comedy central|mtv|vh1|a&e|lifetime|fx|fxx|tnt|warner)\b/)) return 'premium'
  if (text.match(/\b(entretenimiento|entertainment|variety|show|comedy|comedia|reality|talent|bailando|cantando|concurs|telenovela|novela|series|serie|telefe|televisa|tv azteca|record|gala|farandula|espectaculo|magazine|talk show|late night|mtv|vh1|e!|entertainment)\b/)) return 'entretenimiento'
  return 'movies'
}

export default function SettingsPanel() {
  const { isAdmin, login, logout } = useAuth()
  const { importM3U, addChannel, addMovie } = useContent()
  
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
  const [autoDetect, setAutoDetect] = useState(true)

  const [newMovie, setNewMovie] = useState({ 
    title: '', 
    url: '', 
    poster: '', 
    description: '', 
    rating: '7.5', 
    category: 'movies' as Category,
    genre: 'Movies'
  })
  const [isAddingMovie, setIsAddingMovie] = useState(false)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewMovie({ ...newMovie, poster: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewMovie({ ...newMovie, poster: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMovie.title || !newMovie.url) {
      setError('El título y la URL del stream son obligatorios')
      return
    }
    setIsAddingMovie(true)
    try {
      await addMovie({
        title: newMovie.title,
        url: newMovie.url,
        poster: newMovie.poster || undefined,
        description: newMovie.description || undefined,
        rating: parseFloat(newMovie.rating) || 7.5,
        year: new Date().getFullYear(),
        genre: newMovie.genre,
        duration: '',
        category: newMovie.category
      })
      setSuccess(`✅ "${newMovie.title}" agregado exitosamente`)
      setNewMovie({ title: '', url: '', poster: '', description: '', rating: '7.5', category: 'movies', genre: 'Movies' })
    } catch (err) {
      setError('Error al guardar la película')
    } finally {
      setIsAddingMovie(false)
      setTimeout(() => setSuccess(''), 3000)
    }
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

      const importedCount = await importM3U(content, categoryId)
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
        const detectedCategory = detectCategory(channelName, currentGroup)

        results.push({ url: cleanUrl, name: channelName, logo: currentLogo, group: currentGroup, status: 'checking', detectedCategory })
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

  const handleSaveWorkingStreams = async () => {
    const workingStreams = checkResults.filter(result => result.status === 'online')
    if (workingStreams.length === 0) {
      setError('No hay streams funcionando')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    setIsChecking(true)
    const groupedByCategory: Record<string, typeof workingStreams> = {}
    workingStreams.forEach(stream => {
      const cat = autoDetect ? (stream.detectedCategory || 'movies') : checkTargetCategory
      if (!groupedByCategory[cat]) groupedByCategory[cat] = []
      groupedByCategory[cat].push(stream)
    })

    let totalSaved = 0
    const categorySummary: string[] = []

    try {
      for (const [categoryId, streams] of Object.entries(groupedByCategory)) {
        const m3uContent = streams.map(stream => {
          let extinf = '#EXTINF:-1'
          if (stream.logo) extinf += ` tvg-logo="${stream.logo}"`
          if (stream.group) extinf += ` group-title="${stream.group}"`
          extinf += `,${stream.name}`
          return `${extinf}\n${stream.url}`
        }).join('\n')

        const importedCount = await importM3U(m3uContent, categoryId as Category)
        totalSaved += importedCount
        if (importedCount > 0) {
          const catName = categories.find(c => c.id === categoryId)?.name || categoryId
          categorySummary.push(`${importedCount} en ${catName}`)
        }
      }

      if (totalSaved > 0) {
        setSuccess(`✅ ${totalSaved} streams guardados: ${categorySummary.join(', ')}`)
        setCheckResults([])
        setCheckList('')
      } else {
        setError('No se pudo guardar en la base de datos')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      setError('Error de conexión al guardar')
    } finally {
      setIsChecking(false)
      setTimeout(() => { setSuccess(''); setError('') }, 5000)
    }
  }

  const onlineStreams = checkResults.filter(r => r.status === 'online')
  const categoryCount: Record<string, number> = {}
  onlineStreams.forEach(s => {
    const cat = s.detectedCategory || 'movies'
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  })

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
              <label className="text-sm text-[#808080] flex items-center gap-2"><Key className="w-4 h-4"/>Contraseña de Administrador</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="Ingresa la contraseña..." className="w-full px-4 py-3 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white pr-12"/>
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080]">{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
              </div>
            </div>
            {error && <div className="flex items-center gap-2 text-[#E50914] text-sm bg-[#E50914]/10 border border-[#E50914]/30 rounded-md p-3"><AlertCircle className="w-4 h-4"/>{error}</div>}
            <button onClick={handleLogin} disabled={!password} className="w-full py-3 bg-[#E50914] text-white rounded-md font-medium hover:bg-[#F40612] disabled:opacity-50 flex items-center justify-center gap-2"><Lock className="w-4 h-4"/>Acceder como Administrador</button>
            <div className="bg-[#2F2F2F] border border-[#3F3F3F] rounded-md p-4">
              <p className="text-xs text-[#808080] flex items-center gap-2"><AlertCircle className="w-3 h-3"/>Contraseña demo: <code className="text-[#E50914] bg-[#E50914]/10 px-1.5 py-0.5 rounded font-mono">tunetv2026</code></p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-md p-3">
              <CheckCircle className="w-4 h-4 text-green-400"/>
              <span className="text-green-400 text-sm font-medium">Autenticado como Administrador</span>
            </div>
            {success && <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-md p-3"><CheckCircle className="w-4 h-4"/>{success}</div>}
            {error && <div className="flex items-center gap-2 text-[#E50914] text-sm bg-[#E50914]/10 border border-[#E50914]/30 rounded-md p-3"><AlertCircle className="w-4 h-4"/>{error}</div>}

            {/* --- MOVIE UPLOAD FORM --- */}
            <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-6">
              <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
                <Film className="w-5 h-5 text-[#E50914]"/>Agregar Película o Serie
              </h4>
              <form onSubmit={handleAddMovie} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#808080]">Título *</label>
                  <input required type="text" value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" placeholder="Ej: Inception" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#808080]">Categoría</label>
                  <select value={newMovie.category} onChange={e => setNewMovie({...newMovie, category: e.target.value as Category})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#808080]">Género / Tipo</label>
                  <select value={newMovie.genre} onChange={e => setNewMovie({...newMovie, genre: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none">
                    <option value="Movies">Movies</option>
                    <option value="Series">Series</option>
                    <option value="Documental">Documental</option>
                    <option value="Anime">Anime</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#808080]">Calificación (1.0 - 10.0)</label>
                  <input type="number" step="0.1" min="1" max="10" value={newMovie.rating} onChange={e => setNewMovie({...newMovie, rating: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" placeholder="7.5" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-[#808080]">URL del Stream (.m3u8) *</label>
                  <input required type="url" value={newMovie.url} onChange={e => setNewMovie({...newMovie, url: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" placeholder="https://ejemplo.com/stream.m3u8" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-[#808080]">Poster (Imagen)</label>
                  <div className="flex items-start gap-4">
                    <label 
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="flex-1 cursor-pointer border-2 border-dashed border-[#3F3F3F] hover:border-[#E50914] rounded-md p-6 flex flex-col items-center justify-center transition-colors bg-[#2F2F2F]"
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                      <Upload className="w-8 h-8 text-[#808080] mb-2" />
                      <span className="text-xs text-[#808080] text-center">Arrastra una imagen o haz clic para subir</span>
                    </label>
                    {newMovie.poster && (
                      <div className="relative w-24 h-36 rounded-md overflow-hidden bg-black border border-[#3F3F3F] flex-shrink-0">
                        <img src={newMovie.poster} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setNewMovie({ ...newMovie, poster: '' })}
                          className="absolute top-1 right-1 bg-[#E50914] text-white rounded-full p-1 hover:bg-[#F40612] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-[#808080]">Sinopsis / Descripción</label>
                  <textarea value={newMovie.description} onChange={e => setNewMovie({...newMovie, description: e.target.value})} rows={3} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none resize-none" placeholder="Breve descripción de la película o serie..." />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" disabled={isAddingMovie} className="w-full py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    {isAddingMovie ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Guardando...</> : <><Plus className="w-4 h-4"/>Agregar al Catálogo</>}
                  </button>
                </div>
              </form>
            </div>

            {/* --- M3U IMPORT & STREAM CHECKER --- */}
            <div className="space-y-4">
              <h4 className="text-white font-bold text-lg flex items-center gap-2"><Upload className="w-5 h-5 text-[#E50914]"/>Importar Contenido por Categoría (M3U)</h4>
              <p className="text-[#808080] text-sm">Selecciona la categoría y pega la URL o contenido M3U</p>
              {categories.map((category) => {
                const Icon = category.icon
                const isImporting = importingCategory === category.id
                return (
                  <div key={category.id} className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#E50914]/10 rounded-md flex items-center justify-center"><Icon className="w-5 h-5 text-[#E50914]"/></div>
                      <div><h5 className="text-white font-medium">{category.name}</h5></div>
                    </div>
                    <textarea value={categoryUrls[category.id]} onChange={(e) => setCategoryUrls({ ...categoryUrls, [category.id]: e.target.value })} placeholder="Pega aquí la URL de la lista M3U o el contenido..." rows={4} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm resize-none mb-3 font-mono"/>
                    <button onClick={() => handleImportCategory(category.id)} disabled={!categoryUrls[category.id].trim() || isImporting} className="w-full py-2 bg-[#E50914] text-white rounded-md hover:bg-[#F40612] disabled:opacity-50 flex items-center justify-center gap-2">
                      {isImporting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Importando...</> : <><Upload className="w-4 h-4"/>Importar en {category.name}</>}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4">
              <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-3"><CheckCircle className="w-5 h-5 text-green-400"/>Verificador de Streams con Detección Automática</h4>
              <div className="bg-[#1F1F1F] border border-[#3F3F3F] rounded-md p-3 mb-3">
                <p className="text-white text-xs font-medium mb-1">📋 Instrucciones:</p>
                <ol className="text-[#808080] text-xs space-y-1 list-decimal list-inside">
                  <li>Pega tus URLs o lista M3U abajo</li>
                  <li>Haz clic en "Verificar Streams"</li>
                  <li>El sistema detectará automáticamente la categoría de cada canal</li>
                  <li>Haz clic en "Guardar Streams Funcionales" y se guardarán en su categoría correcta</li>
                </ol>
              </div>
              <textarea value={checkList} onChange={(e) => setCheckList(e.target.value)} placeholder="Pega URLs para verificar (una por línea)..." rows={5} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm resize-none mb-3 font-mono"/>
              <button onClick={handleCheckStreams} disabled={!checkList.trim() || isChecking} className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 mb-4">
                {isChecking ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Verificando...</> : <><CheckCircle className="w-4 h-4"/>Verificar Streams</>}
              </button>

              {checkResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h5 className="text-white text-sm font-medium">Resultados:</h5>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-400">✓ {onlineStreams.length} online</span>
                      <span className="text-[#E50914]">✗ {checkResults.filter(r => r.status === 'offline').length} offline</span>
                    </div>
                  </div>

                  {onlineStreams.length > 0 && Object.keys(categoryCount).length > 0 && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-md p-3">
                      <p className="text-white text-xs font-bold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400"/>Detección automática de categorías:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(categoryCount).map(([catId, count]) => {
                          const cat = categories.find(c => c.id === catId)
                          const CatIcon = cat?.icon || Film
                          return (
                            <div key={catId} className="flex items-center gap-1.5 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md px-2 py-1">
                              <CatIcon className="w-3.5 h-3.5 text-[#E50914]"/>
                              <span className="text-white text-xs font-medium">{count}</span>
                              <span className="text-[#808080] text-xs">en {cat?.name || catId}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#1F1F1F] border border-[#3F3F3F] rounded-md p-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={autoDetect} onChange={(e) => setAutoDetect(e.target.checked)} className="w-4 h-4 accent-[#E50914]"/>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400"/>Detección automática de categorías</p>
                        <p className="text-[#808080] text-xs">Cada canal se guardará en la categoría que le corresponda según su nombre</p>
                      </div>
                    </label>
                    {!autoDetect && (
                      <div className="mt-3 pt-3 border-t border-[#3F3F3F]">
                        <label className="text-white text-xs font-medium mb-2 block">Guardar TODO en categoría:</label>
                        <select value={checkTargetCategory} onChange={(e) => setCheckTargetCategory(e.target.value as Category)} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:outline-none focus:border-[#E50914]">
                          {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                        </select>
                      </div>
                    )}
                  </div>

                  {checkResults.map((result, index) => {
                    const detectedCat = categories.find(c => c.id === result.detectedCategory)
                    const DetectedIcon = detectedCat?.icon || Film
                    return (
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
                          {result.group && <p className="text-[#808080] text-xs truncate">Grupo: {result.group}</p>}
                          {result.status === 'online' && detectedCat && (
                            <p className="text-xs text-purple-400 flex items-center gap-1 mt-0.5">
                              <DetectedIcon className="w-3 h-3"/>→ {detectedCat.name}
                            </p>
                          )}
                          <p className="text-[#808080] text-xs truncate">{result.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.status === 'online' && (
                            <button onClick={() => handleCopyUrl(result.url)} className="p-1.5 bg-[#3F3F3F] hover:bg-[#4F4F4F] rounded" title="Copiar URL"><Copy className="w-3.5 h-3.5 text-white"/></button>
                          )}
                          {result.status === 'offline' && (
                            <button onClick={() => handleRemoveOfflineUrl(result.url)} className="p-1.5 bg-[#E50914]/20 hover:bg-[#E50914]/40 rounded" title="Eliminar"><Trash2 className="w-3.5 h-3.5 text-[#E50914]"/></button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {onlineStreams.length > 0 && !isChecking && (
                    <button onClick={handleSaveWorkingStreams} disabled={isChecking} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-70">
                      {isChecking ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>Guardando en sus categorías...</> : <><Save className="w-5 h-5"/>Guardar {onlineStreams.length} Streams en sus Categorías Correctas</>}
                    </button>
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