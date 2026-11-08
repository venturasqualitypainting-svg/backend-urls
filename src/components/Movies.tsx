import { useState, useEffect, useRef } from 'react'
import { Search, CheckSquare, Square, Trash2, Film, Play, Plus, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'
import { useMiLista } from '../hooks/useMiLista'
import Hls from 'hls.js'
import { SkeletonRow } from './Skeleton'

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

interface MovieItemType extends HoveredItem {
  type: 'channel' | 'movie'
  year?: number
}

// ============================================
// MOVIE CARD (Simple, sin video inline)
// ============================================
function MovieCard({
  item,
  onHover,
  onHoverEnd,
  onPlay,
  isAdmin,
  onDelete
}: {
  item: MovieItemType
  onHover: () => void
  onHoverEnd: () => void
  onPlay: () => void
  isAdmin: boolean
  onDelete?: () => void
}) {
  const { miLista, toggleMiLista, isInMiLista } = useMiLista()
  const inList = isInMiLista(item.id)

  return (
    <div
      className="relative flex-none w-[160px] md:w-[200px] cursor-pointer group transition-transform duration-300 hover:scale-105"
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[#2F2F2F] shadow-lg">
        <img
          src={item.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop'}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop'
          }}
        />

        {item.rating && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold text-green-400 border border-green-400/30">
            {Number(item.rating).toFixed(1)}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <h3 className="text-white text-sm font-bold mb-2 line-clamp-2">{item.title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onPlay() }}
              className="flex-1 bg-white text-black py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
            >
              <Play className="w-3 h-3 fill-black" /> Play
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleMiLista(item.id) }}
              className="w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center text-white hover:border-white transition-colors"
            >
              {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            {isAdmin && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center text-white hover:border-[#E50914] hover:text-[#E50914] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-white text-xs font-medium mt-2 truncate">{item.title}</p>
      {item.genre && <p className="text-[#808080] text-[10px] truncate">{item.genre}</p>}
    </div>
  )
}

// ============================================
// FLOATING GLOBAL PREVIEW PLAYER
// ============================================
function FloatingPreview({ item }: { item: HoveredItem | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!item || !videoRef.current) return

    setIsLoading(true)
    setHasError(false)

    const video = videoRef.current

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
        startLevel: -1,
        capLevelToPlayerSize: true,
        debug: false,
      })
      hlsRef.current = hls

      hls.loadSource(item.url)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
        video.play().catch(() => {})
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data)
          setHasError(true)
          setIsLoading(false)
          hls.destroy()
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = item.url
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false)
        video.play().catch(() => {})
      })
      video.addEventListener('error', () => {
        setHasError(true)
        setIsLoading(false)
      })
    } else {
      setHasError(true)
      setIsLoading(false)
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [item?.url])

  if (!item) return null

  return (
    <div className="fixed top-28 right-4 md:right-12 z-[9999] w-[280px] md:w-[320px] pointer-events-none">
      <div className="bg-[#181818] rounded-lg shadow-2xl border border-[#2F2F2F] overflow-hidden pointer-events-auto">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            autoPlay
          />

          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="w-10 h-10 border-[3px] border-[#E50914] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
              <div className="text-center">
                <X className="w-8 h-8 text-[#E50914] mx-auto mb-2" />
                <p className="text-white text-xs">Stream no disponible</p>
              </div>
            </div>
          )}

          {(isLoading || hasError) && item.poster && (
            <img
              src={item.poster}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}

          <div className="absolute top-2 left-2 bg-[#E50914] px-2 py-0.5 rounded text-xs font-bold text-white">
            PREVIEW
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-white text-base font-bold mb-2 line-clamp-1">{item.title}</h3>

          <div className="flex items-center gap-2 text-xs mb-3">
            {item.rating && (
              <span className="text-green-400 font-bold">{Math.floor(Number(item.rating) * 10)}% Match</span>
            )}
            <span className="border border-[#606060] px-1.5 py-0.5 text-[#B3B3B3] rounded text-[10px]">HD</span>
            {item.genre && (
              <span className="text-[#B3B3B3] truncate">{item.genre}</span>
            )}
          </div>

          {item.description && (
            <p className="text-[#B3B3B3] text-xs line-clamp-3 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN MOVIES COMPONENT
// ============================================
export default function Movies({ onPlayMovie }: MoviesProps) {
  const { isAdmin } = useAuth()
  const { movies, channels, removeMovie, removeChannel } = useContent()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null)

  const categoryChannels = channels.filter(c => c.category === 'movies')
  const categoryMovies = movies.filter(m => m.category === 'movies')

  const items: MovieItemType[] = [
    ...categoryChannels.map(c => ({
      id: c.id,
      title: c.name,
      year: new Date().getFullYear(),
      genre: (c.group === 'General' || !c.group) ? 'Series' : c.group,
      rating: 7.5,
      poster: c.logo,
      url: c.url,
      type: 'channel' as const,
      description: 'Canal en vivo'
    })),
    ...categoryMovies.map(m => ({
      id: m.id,
      title: m.title,
      year: m.year,
      genre: (m.genre === 'General' || !m.genre) ? 'Series' : m.genre,
      rating: m.rating,
      poster: m.poster,
      url: m.url,
      type: 'movie' as const,
      description: m.description
    }))
  ]

  const filteredItems = items.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))

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
      selectedItems.forEach(id => {
        const item = items.find(i => i.id === id)
        if (item) {
          if (item.type === 'channel') removeChannel(id)
          else removeMovie(id)
        }
      })
      setSelectedItems(new Set())
    }
  }

  const genres = [...new Set(items.map(i => i.genre).filter(Boolean))] as string[]

  return (
    <div className="pt-8">
      <FloatingPreview item={hoveredItem} />

      <div className="px-4 md:px-12 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Film className="w-8 h-8 text-[#E50914]" />
          <h2 className="text-3xl md:text-4xl font-bold text-white">Movies & Series</h2>
        </div>
        <p className="text-[#808080] text-sm">{items.length} títulos disponibles</p>
      </div>

      <div className="px-4 md:px-12 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar películas, series y canales..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#E50914] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedItems(new Set(filteredItems.map(i => i.id)))}
              className="px-4 py-2.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm transition-colors flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" /> Seleccionar todos
            </button>
            {selectedItems.size > 0 && (
              <>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="px-4 py-2.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Square className="w-4 h-4" /> Deseleccionar
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-4 py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar ({selectedItems.size})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="px-4 md:px-12">
          <SkeletonRow />
        </div>
      ) : (
        <div className="px-4 md:px-12 space-y-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-4">
              {searchTerm ? `Resultados para "${searchTerm}"` : 'Movies'}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {filteredItems.map((item, index) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  onHover={() => setHoveredItem(item)}
                  onHoverEnd={() => setHoveredItem(null)}
                  onPlay={() => onPlayMovie(item.url, item.title, index)}
                  isAdmin={isAdmin}
                  onDelete={() => {
                    if (item.type === 'channel') removeChannel(item.id)
                    else removeMovie(item.id)
                  }}
                />
              ))}
            </div>
          </div>

          {searchTerm === '' && genres.slice(0, 4).map(genre => {
            const genreItems = items.filter(i => i.genre === genre)
            if (genreItems.length === 0) return null
            return (
              <div key={genre}>
                <h3 className="text-white text-xl font-bold mb-4">{genre}</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {genreItems.map((item, index) => (
                    <MovieCard
                      key={item.id}
                      item={item}
                      onHover={() => setHoveredItem(item)}
                      onHoverEnd={() => setHoveredItem(null)}
                      onPlay={() => onPlayMovie(item.url, item.title, index)}
                      isAdmin={isAdmin}
                      onDelete={() => {
                        if (item.type === 'channel') removeChannel(item.id)
                        else removeMovie(item.id)
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}