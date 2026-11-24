// src/components/Movies.tsx
import { useState, useRef, useEffect } from 'react'
import { Search, CheckSquare, Square, Trash2, Film, Play, Plus, Check, X, Edit, Upload, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUserAuth } from '../context/UserAuthContext'
import { useContent, Movie } from '../context/ContentContext'
import { useMiLista } from '../hooks/useMiLista'
import Hls from 'hls.js'
import { SkeletonRow } from './Skeleton'
import Row from './Row'

interface MoviesProps {
  onPlayMovie: (url: string, title: string, index?: number) => void
}

interface HoveredItem {
  id: string
  title: string
  url: string
  poster?: string
  description?: string
  rating?: number
  genre?: string
}

function MovieCard({
  item,
  onHover,
  onHoverEnd,
  onClick,
  isAdmin,
  onDelete,
  onEdit
}: {
  item: Movie
  onHover: () => void
  onHoverEnd: () => void
  onClick: () => void
  isAdmin: boolean
  onDelete?: () => void
  onEdit?: () => void
}) {
  const { miLista, toggleMiLista, isInMiLista } = useMiLista()
  const inList = isInMiLista(item.id)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative flex-none w-[160px] md:w-[200px] cursor-pointer group transition-transform duration-300 hover:scale-105"
      onMouseEnter={() => { setIsHovered(true); onHover() }}
      onMouseLeave={() => { setIsHovered(false); onHoverEnd() }}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[#2F2F2F] shadow-lg">
        <img
          src={item.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop'}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop' }}
        />
        
        {item.genre?.toLowerCase().trim() === 'series' && (
          <div className="absolute top-2 left-2 bg-[#E50914] px-2 py-0.5 rounded text-[10px] font-bold text-white z-10">SERIE</div>
        )}
        
        {item.rating && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold text-green-400 border border-green-400/30 z-10">
            {Number(item.rating).toFixed(1)}
          </div>
        )}

        {/* ✅ BOTONES DE ADMIN: Editar y Eliminar */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1 z-20">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                className="w-8 h-8 bg-[#4A90E2] hover:bg-[#357ABD] rounded-full flex items-center justify-center transition-all shadow-lg"
                title="Editar"
              >
                <Edit className="w-4 h-4 text-white"/>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="w-8 h-8 bg-[#E50914] hover:bg-[#F40612] rounded-full flex items-center justify-center transition-all shadow-lg"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-white"/>
              </button>
            )}
          </div>
        )}

        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-300 flex flex-col justify-end p-3 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <h3 className="text-white text-sm font-bold mb-2 line-clamp-2">{item.title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onClick() }}
              className="flex-1 bg-white text-black py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
            >
              <Play className="w-3 h-3 fill-black" /> {item.genre?.toLowerCase().trim() === 'series' ? 'Ver' : 'Play'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleMiLista(item.id) }}
              className="w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center text-white hover:border-white transition-colors"
            >
              {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      <p className="text-white text-xs font-medium mt-2 truncate">{item.title}</p>
    </div>
  )
}

function FloatingPreview({ item }: { item: HoveredItem | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!item || !videoRef.current) return
    setIsLoading(true); setHasError(false)
    const video = videoRef.current
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 30, startLevel: -1, capLevelToPlayerSize: true, debug: false })
      hlsRef.current = hls
      hls.loadSource(item.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => { setIsLoading(false); video.play().catch(() => {}) })
      hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) { setHasError(true); setIsLoading(false); hls.destroy() } })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = item.url
      video.addEventListener('loadedmetadata', () => { setIsLoading(false); video.play().catch(() => {}) })
      video.addEventListener('error', () => { setHasError(true); setIsLoading(false) })
    } else { setHasError(true); setIsLoading(false) }
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
      video.pause(); video.removeAttribute('src'); video.load()
    }
  }, [item?.url])

  if (!item) return null
  return (
    <div className="fixed top-28 right-4 md:right-12 z-[9999] w-[280px] md:w-[320px] pointer-events-none">
      <div className="bg-[#181818] rounded-lg shadow-2xl border border-[#2F2F2F] overflow-hidden pointer-events-auto">
        <div className="relative aspect-video bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
          {isLoading && !hasError && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><div className="w-10 h-10 border-[3px] border-[#E50914] border-t-transparent rounded-full animate-spin" /></div>}
          {hasError && <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4"><div className="text-center"><X className="w-8 h-8 text-[#E50914] mx-auto mb-2" /><p className="text-white text-xs">Stream no disponible</p></div></div>}
          {(isLoading || hasError) && item.poster && <img src={item.poster} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
          <div className="absolute top-2 left-2 bg-[#E50914] px-2 py-0.5 rounded text-xs font-bold text-white">PREVIEW</div>
        </div>
        <div className="p-4">
          <h3 className="text-white text-base font-bold mb-2 line-clamp-1">{item.title}</h3>
          <div className="flex items-center gap-2 text-xs mb-3">
            {item.rating && <span className="text-green-400 font-bold">{Math.floor(Number(item.rating) * 10)}% Match</span>}
            <span className="border border-[#606060] px-1.5 py-0.5 text-[#B3B3B3] rounded text-[10px]">HD</span>
            {item.genre && <span className="text-[#B3B3B3] truncate">{item.genre}</span>}
          </div>
          {item.description && <p className="text-[#B3B3B3] text-xs line-clamp-3 leading-relaxed">{item.description}</p>}
        </div>
      </div>
    </div>
  )
}

function SeriesModal({ series, onClose, onPlay }: { series: Movie, onClose: () => void, onPlay: (url: string, title: string) => void }) {
  const episodes = series.episodes && series.episodes.length > 0 ? series.episodes : [{ title: 'Reproducir', url: series.url }]
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#181818] rounded-lg shadow-2xl border border-[#2F2F2F] w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative h-64 md:h-80">
           <img src={series.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop'} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent" />
           <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-[#E50914] transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6">
          <h2 className="text-3xl font-bold text-white mb-2">{series.title}</h2>
          <div className="flex items-center gap-3 mb-4">
             <span className="text-green-400 font-bold">{Math.floor(Number(series.rating) * 10)}% Match</span>
             <span className="border border-[#606060] px-1.5 py-0.5 text-[#B3B3B3] rounded text-xs">HD</span>
          </div>
          <p className="text-[#B3B3B3] mb-6 leading-relaxed">{series.description || 'Sin descripción disponible.'}</p>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Film className="w-5 h-5 text-[#E50914]" /> Episodios</h3>
          <div className="space-y-3">
            {episodes.map((ep, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-[#2F2F2F] p-3 rounded-md hover:bg-[#3F3F3F] transition-colors group">
                <div className="w-10 h-10 bg-[#E50914] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"><Play className="w-5 h-5 text-white fill-white" /></div>
                <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{ep.title}</p></div>
                <button onClick={() => { onPlay(ep.url, `${series.title} - ${ep.title}`); onClose(); }} className="px-4 py-2 bg-white text-black rounded-md font-bold text-sm hover:bg-gray-200 transition-colors flex-shrink-0">Reproducir</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ✅ MODAL DE EDICIÓN MEJORADO: Permite editar URL, Póster, Título y Descripción
function EditMovieModal({ movie, onClose, onSave }: { movie: Movie, onClose: () => void, onSave: (id: string, data: Partial<Movie>) => void }) {
  const [newUrl, setNewUrl] = useState(movie.url)
  const [newTitle, setNewTitle] = useState(movie.title)
  const [newDescription, setNewDescription] = useState(movie.description || '')
  const [newPoster, setNewPoster] = useState(movie.poster || '')
  const [episodes, setEpisodes] = useState(movie.episodes || [{ title: 'Episodio 1', url: movie.url }])
  const [isSaving, setIsSaving] = useState(false)
  const isSeries = movie.genre?.toLowerCase().trim() === 'series'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setNewPoster(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setNewPoster(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!newUrl.trim()) {
      alert('La URL es obligatoria')
      return
    }
    if (!newTitle.trim()) {
      alert('El título es obligatorio')
      return
    }
    setIsSaving(true)
    
    const updates: Partial<Movie> = {
      url: newUrl,
      title: newTitle,
      description: newDescription,
      poster: newPoster || undefined
    }
    
    if (isSeries) {
      updates.episodes = episodes
    }
    
    await onSave(movie.id, updates)
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#181818] rounded-lg shadow-2xl border border-[#2F2F2F] w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Edit className="w-6 h-6 text-[#4A90E2]" />
              Editar Película/Serie
            </h2>
            <button onClick={onClose} className="text-[#808080] hover:text-white transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-[#808080] font-medium">Título</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#4A90E2] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#808080] font-medium">URL del Stream *</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://ejemplo.com/stream.m3u8"
                className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#4A90E2] outline-none font-mono"
              />
              <p className="text-[10px] text-[#808080]">Pega aquí la nueva URL si el stream se cayó</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#808080] font-medium">Poster / Portada</label>
              <div className="flex items-start gap-4">
                <label 
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex-1 cursor-pointer border-2 border-dashed border-[#3F3F3F] hover:border-[#4A90E2] rounded-md p-6 flex flex-col items-center justify-center transition-colors bg-[#2F2F2F]"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                  <Upload className="w-8 h-8 text-[#808080] mb-2" />
                  <span className="text-xs text-[#808080] text-center">Arrastra una imagen o haz clic</span>
                </label>
                {(newPoster || movie.poster) && (
                  <div className="relative w-24 h-36 rounded-md overflow-hidden bg-black border border-[#3F3F3F] flex-shrink-0">
                    <img src={newPoster || movie.poster} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setNewPoster('')} 
                      className="absolute top-1 right-1 bg-[#E50914] text-white rounded-full p-1 hover:bg-[#F40612]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#808080] font-medium">Descripción / Sinopsis</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#4A90E2] outline-none resize-none"
                placeholder="Breve descripción..."
              />
            </div>

            {isSeries && (
              <div className="space-y-2">
                <label className="text-xs text-[#808080] font-medium">Episodios</label>
                {episodes.map((ep, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      placeholder="Título"
                      value={ep.title}
                      onChange={(e) => {
                        const newEps = [...episodes]
                        newEps[idx].title = e.target.value
                        setEpisodes(newEps)
                      }}
                      className="flex-1 px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#4A90E2] outline-none"
                    />
                    <input
                      placeholder="URL"
                      value={ep.url}
                      onChange={(e) => {
                        const newEps = [...episodes]
                        newEps[idx].url = e.target.value
                        setEpisodes(newEps)
                      }}
                      className="flex-[2] px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#4A90E2] outline-none font-mono"
                    />
                    {episodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEpisodes(episodes.filter((_, i) => i !== idx))}
                        className="p-2 bg-[#E50914] text-white rounded-md hover:bg-[#F40612]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEpisodes([...episodes, { title: `Episodio ${episodes.length + 1}`, url: '' }])}
                  className="text-[#4A90E2] text-sm flex items-center gap-1 hover:underline mt-1"
                >
                  <Plus className="w-4 h-4" /> Agregar episodio
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#2F2F2F] hover:bg-[#3F3F3F] text-white rounded-md font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !newUrl.trim() || !newTitle.trim()}
              className="flex-1 py-3 bg-[#4A90E2] hover:bg-[#357ABD] text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Guardando...</>
              ) : (
                <><Save className="w-4 h-4"/>Guardar Cambios</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Movies({ onPlayMovie }: MoviesProps) {
  const { isAdmin: legacyIsAdmin } = useAuth()
  const { isUserAdmin } = useUserAuth()
  const isAdmin = isUserAdmin || legacyIsAdmin

  const { movies, removeMovie, updateMovie } = useContent()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Movie | null>(null)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  // ✅ DEBUG: Mostrar si eres admin
  console.log('🎬 Movies - isAdmin:', isAdmin, '| isUserAdmin:', isUserAdmin, '| legacyIsAdmin:', legacyIsAdmin)

  const moviesList = movies.filter(m => m.genre?.toLowerCase().trim() === 'movies')
  const seriesList = movies.filter(m => m.genre?.toLowerCase().trim() === 'series')
  const filteredMovies = moviesList.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredSeries = seriesList.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDeleteItem = (item: Movie) => {
    if (confirm(`¿Eliminar "${item.title}"?`)) {
      if (item.id) removeMovie(item.id)
      setSuccessMsg('✅ Película eliminada')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleEditMovie = async (id: string, updates: Partial<Movie>) => {
    try {
      await updateMovie(id, updates)
      setSuccessMsg('✅ Película actualizada correctamente')
      setEditingMovie(null)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      alert('❌ Error al actualizar la película')
    }
  }

  const deleteSelected = () => {
    if (selectedItems.size === 0) return
    if (confirm(`¿Eliminar ${selectedItems.size} elemento(s)?`)) {
      selectedItems.forEach(id => removeMovie(id))
      setSelectedItems(new Set())
    }
  }

  return (
    <div className="pt-8">
      <FloatingPreview item={hoveredItem} />
      {selectedSeries && <SeriesModal series={selectedSeries} onClose={() => setSelectedSeries(null)} onPlay={onPlayMovie} />}
      {editingMovie && <EditMovieModal movie={editingMovie} onClose={() => setEditingMovie(null)} onSave={handleEditMovie} />}

      <div className="px-4 md:px-12 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Film className="w-8 h-8 text-[#E50914]" />
          <h2 className="text-3xl md:text-4xl font-bold text-white">Movies & Series</h2>
          {isAdmin && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
              MODO ADMIN
            </span>
          )}
        </div>
        <p className="text-[#808080] text-sm">{movies.length} títulos disponibles</p>
      </div>

      {successMsg && (
        <div className="px-4 md:px-12 mb-4">
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-md p-3">
            <span>✓</span>{successMsg}
          </div>
        </div>
      )}

      <div className="px-4 md:px-12 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar películas, series..." className="w-full pl-10 pr-4 py-2.5 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none" />
          </div>
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedItems(new Set([...filteredMovies, ...filteredSeries].map(i => i.id)))} className="px-4 py-2.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm transition-colors flex items-center gap-2">
                <CheckSquare className="w-4 h-4" /> Seleccionar todos
              </button>
              {selectedItems.size > 0 && (
                <>
                  <button onClick={() => setSelectedItems(new Set())} className="px-4 py-2.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm transition-colors flex items-center gap-2">
                    <Square className="w-4 h-4" /> Deseleccionar
                  </button>
                  <button onClick={deleteSelected} className="px-4 py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md flex items-center gap-2 transition-colors">
                    <Trash2 className="w-4 h-4" /> Eliminar ({selectedItems.size})
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {filteredMovies.length === 0 && filteredSeries.length === 0 ? (
        <div className="px-4 md:px-12"><SkeletonRow /></div>
      ) : (
        <div className="space-y-8">
          {filteredMovies.length > 0 && (
            <Row title={searchTerm ? `Resultados: ${searchTerm}` : 'Movies'}>
              {filteredMovies.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  onHover={() => setHoveredItem(item)}
                  onHoverEnd={() => setHoveredItem(null)}
                  onClick={() => onPlayMovie(item.url, item.title)}
                  isAdmin={isAdmin}
                  onDelete={() => handleDeleteItem(item)}
                  onEdit={() => setEditingMovie(item)}
                />
              ))}
            </Row>
          )}
          {filteredSeries.length > 0 && (
            <Row title="Series">
              {filteredSeries.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  onHover={() => setHoveredItem(item)}
                  onHoverEnd={() => setHoveredItem(null)}
                  onClick={() => setSelectedSeries(item)}
                  isAdmin={isAdmin}
                  onDelete={() => handleDeleteItem(item)}
                  onEdit={() => setEditingMovie(item)}
                />
              ))}
            </Row>
          )}
        </div>
      )}
    </div>
  )
}