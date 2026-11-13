import { useState, useEffect, useRef } from 'react'
import { Search, CheckSquare, Square, Trash2, Film, Play, Plus, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
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
  onDelete
}: {
  item: Movie
  onHover: () => void
  onHoverEnd: () => void
  onClick: () => void
  isAdmin: boolean
  onDelete?: () => void
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

        {/* ✅ BOTÓN DE ELIMINAR RESTAURADO PARA ADMIN */}
        {isAdmin && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="absolute top-2 right-2 w-8 h-8 bg-[#E50914] hover:bg-[#F40612] rounded-full flex items-center justify-center z-20 transition-all shadow-lg"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-white"/>
          </button>
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

// ... (El resto del componente Movies se mantiene igual, solo aseguramos que pase isAdmin y onDelete)
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

export default function Movies({ onPlayMovie }: MoviesProps) {
  const { isAdmin } = useAuth()
  const { movies, removeMovie } = useContent()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Movie | null>(null)

  const moviesList = movies.filter(m => m.genre?.toLowerCase().trim() === 'movies')
  const seriesList = movies.filter(m => m.genre?.toLowerCase().trim() === 'series')
  const filteredMovies = moviesList.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredSeries = seriesList.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDeleteItem = (item: Movie) => { if (item.id) removeMovie(item.id) }

  const toggleItemSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedItems(newSelected)
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

      <div className="px-4 md:px-12 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Film className="w-8 h-8 text-[#E50914]" />
          <h2 className="text-3xl md:text-4xl font-bold text-white">Movies & Series</h2>
        </div>
        <p className="text-[#808080] text-sm">{movies.length} títulos disponibles</p>
      </div>

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
                />
              ))}
            </Row>
          )}
        </div>
      )}
    </div>
  )
}
