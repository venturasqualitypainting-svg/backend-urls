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
  const [checkTargetCategory, setCheckTargetCategory] = useState<Category>('movies')
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
      setPinSuccess('✅ PIN configurado correctamente')
      setPinInput('')
      setTimeout(() => setPinSuccess(''), 3000)
    } else {
      setError('El PIN debe ser exactamente 4 dígitos numéricos')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleClearPin = () => {
    clearParentalPin()
    setPinSuccess('✅ PIN eliminado')
    setTimeout(() => setPinSuccess(''), 3000)
  }

  const handleUserAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setIsAuthLoading(true)
    if (authMode === 'login') {
      const result = await login(email, password)
      if (!result.success) setAuthError(result.error || 'Error al iniciar sesión')
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
    if (!newMovie.title) { setError('El título es obligatorio'); return }
    const isSeries = newMovie.genre === 'Series'
    if (isSeries && episodes.length > 0 && !episodes[0].url) {
      setError('Debes agregar al menos una URL de episodio para una Serie')
      return
    }
    if (!isSeries && !newMovie.url) {
      setError('La URL del stream es obligatoria para Películas')
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
      setSuccess(`✅ "${newMovie.title}" agregado exitosamente`)
      setNewMovie({ title: '', url: '', poster: '', description: '', rating: '7.5', category: 'movies', genre: 'Movies' })
      setEpisodes([{ title: 'Episodio 1', url: '' }])
    } catch (err: any) {
      setError(`Error al guardar: ${err.message || 'Revisa la consola (F12)'}`)
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
      if (url.startsWith('http')) {
        try {
          const response = await fetch(url)
          content = await response.text()
        } catch {
          const result = await addChannel({ name: `Canal ${categoryId}`, url: url.trim(), category: categoryId })
          if (result.success) setSuccess(`✅ ${result.message}`)
          else setSuccess(`ℹ️ ${result.message}`)
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
        setSuccess(`✅ ${importedCount} canales nuevos importados en ${categoryName}`)
      } else {
        setSuccess('ℹ️ No se encontraron canales nuevos (todos ya existen)')
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
      setSuccess('✅ Datos recargados desde Supabase')
    } catch (err) {
      setError('Error al recargar datos')
    } finally {
      setIsRefreshing(false)
      setTimeout(() => { setSuccess(''); setError('') }, 3000)
    }
  }

  const totalChannels = Object.values(categoryCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="px-4 md:px-12 py-8 max-w-[1920px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-[#E50914]"/>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Configuración</h2>
        </div>
        <p className="text-[#808080] text-sm">Panel de administración y cuenta de usuario</p>
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
              {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h3>
            <p className="text-[#808080] text-center text-sm mb-6">
              {authMode === 'login' ? 'Accede para gestionar tu programación.' : 'Regístrate para crear tu programación.'}
            </p>
            <form onSubmit={handleUserAuth} className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs text-[#808080] flex items-center gap-2"><UserIcon className="w-4 h-4" /> Nombre</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none" required={authMode === 'register'} />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-[#808080] flex items-center gap-2"><Mail className="w-4 h-4" /> Correo Electrónico</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#808080] flex items-center gap-2"><Lock className="w-4 h-4" /> Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-[#333333] border border-[#444444] rounded-md text-white text-sm focus:border-[#E50914] focus:outline-none pr-12" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-white">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {authError && (<div className="flex items-center gap-2 text-[#E50914] text-sm bg-[#E50914]/10 border border-[#E50914]/30 rounded-md p-3"><AlertCircle className="w-4 h-4" /><span>{authError}</span></div>)}
              <button type="submit" disabled={isAuthLoading} className="w-full py-3 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isAuthLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); setEmail(''); setPassword(''); setName('') }} className="text-[#808080] hover:text-white text-sm transition-colors">
                {authMode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ✅ PERFIL DE USUARIO */}
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
              <button onClick={userLogout} className="flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2 bg-[#2F2F2F] hover:bg-[#444444] text-white rounded-md text-sm font-medium transition-colors flex"><LogOut className="w-4 h-4" /> Cerrar Sesión</button>
              <button onClick={async () => { if (confirm('⚠️ ¿Estás seguro de que deseas eliminar tu cuenta?')) { const result = await deleteAccount(); if (result.success) alert('Cuenta eliminada'); else alert('Error: ' + result.error) } }} className="flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md text-sm font-medium transition-colors flex"><Trash2 className="w-4 h-4" /> Eliminar Cuenta</button>
            </div>
          </div>

          {/* ✅ DIAGNÓSTICO: Contador de canales por categoría */}
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-white font-bold text-lg flex items-center gap-2">
                  📊 Estado de Canales en Supabase
                </h4>
                <p className="text-[#808080] text-xs mt-1">Total: {totalChannels} canales</p>
              </div>
              <button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white rounded-md text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
            <p className="text-[#808080] text-xs mt-4 flex items-center gap-1">
              💡 Si los números no coinciden con lo que ves en tu celular, presiona "Recargar Datos"
            </p>
          </div>

          {/* PIN PARENTAL */}
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#E50914]/10 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#E50914]" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Control Parental (PIN)</h4>
                <p className="text-[#808080] text-sm">Protege el acceso con un PIN de 4 dígitos</p>
              </div>
            </div>
            {parentalPin ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-md p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-green-400 font-medium text-sm">PIN Activo</p>
                    <p className="text-[#808080] text-xs">PIN configurado: ••••</p>
                  </div>
                </div>
                <button onClick={handleClearPin} className="px-4 py-2 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md text-sm font-medium transition-colors">Eliminar PIN</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="password" inputMode="numeric" pattern="\d*" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="flex-1 px-4 py-3 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-center text-2xl tracking-widest focus:border-[#E50914] outline-none" />
                  <button onClick={handleSetPin} disabled={pinInput.length !== 4} className="px-6 py-3 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-medium disabled:opacity-50 transition-colors">Configurar PIN</button>
                </div>
                <p className="text-[#808080] text-xs flex items-center gap-1"><Hash className="w-3 h-3" /> Ingresa exactamente 4 números</p>
              </div>
            )}
            {pinSuccess && (<div className="mt-3 flex items-center gap-2 text-green-400 text-sm"><CheckCircle className="w-4 h-4"/>{pinSuccess}</div>)}
          </div>

          {success && (<div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-md p-3"><CheckCircle className="w-4 h-4"/>{success}</div>)}
          {error && (<div className="flex items-center gap-2 text-[#E50914] text-sm bg-[#E50914]/10 border border-[#E50914]/30 rounded-md p-3"><AlertCircle className="w-4 h-4"/>{error}</div>)}

          {/* AGREGAR PELÍCULA */}
          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-6">
            <h4 className="text-white font-bold text-lg flex items-center gap-2 mb-4"><Film className="w-5 h-5 text-[#E50914]"/>Agregar Película o Serie</h4>
            <form onSubmit={handleAddMovie} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Título *</label>
                <input required type="text" value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" placeholder="Ej: Gold Rush" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Categoría</label>
                <select value={newMovie.category} onChange={e => setNewMovie({...newMovie, category: e.target.value as Category})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Género</label>
                <select value={newMovie.genre} onChange={e => setNewMovie({...newMovie, genre: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none">
                  <option value="Movies">Movies</option>
                  <option value="Series">Series</option>
                  <option value="Documental">Documental</option>
                  <option value="Anime">Anime</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#808080]">Calificación</label>
                <input type="number" step="0.1" min="1" max="10" value={newMovie.rating} onChange={e => setNewMovie({...newMovie, rating: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" placeholder="7.5" />
              </div>
              {newMovie.genre === 'Series' ? (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-[#808080]">Episodios</label>
                  {episodes.map((ep, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input placeholder="Título" value={ep.title} onChange={e => { const newEps = [...episodes]; newEps[idx].title = e.target.value; setEpisodes(newEps) }} className="flex-1 px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" />
                      <input placeholder="URL" value={ep.url} onChange={e => { const newEps = [...episodes]; newEps[idx].url = e.target.value; setEpisodes(newEps) }} className="flex-[2] px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" />
                      {episodes.length > 1 && (<button type="button" onClick={() => setEpisodes(episodes.filter((_, i) => i !== idx))} className="p-2 bg-[#E50914] text-white rounded-md hover:bg-[#F40612]"><Trash2 className="w-4 h-4" /></button>)}
                    </div>
                  ))}
                  <button type="button" onClick={() => setEpisodes([...episodes, { title: `Episodio ${episodes.length + 1}`, url: '' }])} className="text-[#E50914] text-sm flex items-center gap-1 hover:underline mt-1"><Plus className="w-4 h-4" /> Agregar episodio</button>
                </div>
              ) : (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-[#808080]">URL del Stream *</label>
                  <input required type="url" value={newMovie.url} onChange={e => setNewMovie({...newMovie, url: e.target.value})} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" placeholder="https://ejemplo.com/stream.m3u8" />
                </div>
              )}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-[#808080]">Poster</label>
                <div className="flex items-start gap-4">
                  <label onDrop={handleDrop} onDragOver={handleDragOver} className="flex-1 cursor-pointer border-2 border-dashed border-[#3F3F3F] hover:border-[#E50914] rounded-md p-6 flex flex-col items-center justify-center transition-colors bg-[#2F2F2F]">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <Upload className="w-8 h-8 text-[#808080] mb-2" />
                    <span className="text-xs text-[#808080] text-center">Arrastra o haz clic</span>
                  </label>
                  {newMovie.poster && (
                    <div className="relative w-24 h-36 rounded-md overflow-hidden bg-black border border-[#3F3F3F] flex-shrink-0">
                      <img src={newMovie.poster} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setNewMovie({ ...newMovie, poster: '' })} className="absolute top-1 right-1 bg-[#E50914] text-white rounded-full p-1 hover:bg-[#F40612]"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-[#808080]">Descripción</label>
                <textarea value={newMovie.description} onChange={e => setNewMovie({...newMovie, description: e.target.value})} rows={3} className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none resize-none" placeholder="Breve descripción..." />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={isAddingMovie} className="w-full py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {isAddingMovie ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Guardando...</>) : (<><Plus className="w-4 h-4"/>Agregar al Catálogo</>)}
                </button>
              </div>
            </form>
          </div>

          {/* IMPORTAR M3U */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg flex items-center gap-2"><Upload className="w-5 h-5 text-[#E50914]"/>Importar Contenido por Categoría</h4>
            {categories.map((category) => {
              const Icon = category.icon
              const isImporting = importingCategory === category.id
              return (
                <div key={category.id} className="bg-[#141414] border border-[#2F2F2F] rounded-md p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#E50914]/10 rounded-md flex items-center justify-center"><Icon className="w-5 h-5 text-[#E50914]"/></div>
                    <div><h5 className="text-white font-medium">{category.name}</h5></div>
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
