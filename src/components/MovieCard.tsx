import { useState, useRef, useEffect } from 'react'
import { Play, Info, Plus, Check } from 'lucide-react'
import Hls from 'hls.js'
import { useMiLista } from '../hooks/useMiLista'

interface MovieCardProps {
  id: string
  title: string
  poster: string
  url: string
  description?: string
  rating?: number
  onPlay: () => void
  onDelete?: () => void
}

export default function MovieCard({ id, title, poster, url, description, rating = 7.5, onPlay, onDelete }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const { toggleMiLista, isInMiLista } = useMiLista()
  const inList = isInMiLista(id)

  // FILTRO DE SEGURIDAD: Solo intentar preview si es un enlace http real
  const isVideoUrl = url && url.startsWith('http');

  useEffect(() => {
    if (isHovered && videoRef.current && isVideoUrl) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 2,
          maxMaxBufferLength: 5,
        })
        hlsRef.current = hls
        hls.loadSource(url)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(() => {})
        })
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current?.play()
        })
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
      }
    }
  }, [isHovered, url, isVideoUrl])

  return (
    <div 
      className="relative flex-none w-[160px] md:w-[220px] group cursor-pointer transition-all duration-300 ease-out z-10 hover:z-50 hover:scale-110"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-[#2F2F2F] shadow-lg">
        {/* Si el póster es el emoji de TV, ponemos un fondo oscuro elegante en lugar de una imagen rota */}
        {poster === '📺' ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1e1e] p-4 text-center">
            <span className="text-4xl mb-2">📺</span>
            <span className="text-white text-xs font-semibold line-clamp-2">{title}</span>
          </div>
        ) : (
          <img 
            src={poster || 'https://unsplash.com'} 
            alt={title} 
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: isHovered && isVideoUrl ? 0 : 1 }}
          />
        )}
        
        {isVideoUrl && (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            muted
            playsInline
            loop
          />
        )}

        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold text-green-400 border border-green-400/30">
          {rating}
        </div>
      </div>

      <div 
        className={`absolute top-full left-0 right-0 bg-[#181818] rounded-b-md shadow-2xl border-t border-[#2F2F2F] p-3 transition-all duration-300 origin-top ${
          isHovered ? 'opacity-100 scale-100 visible mt-0' : 'opacity-0 scale-95 invisible -mt-2'
        }`}
      >
        <h3 className="text-white text-sm font-bold mb-2 line-clamp-2">{title}</h3>
        
        <div className="flex items-center gap-2 mb-3">
          <button 
            onClick={onPlay}
            className="flex-1 bg-white text-black py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
          >
            <Play className="w-3 h-3 fill-black" /> Reproducir
          </button>
          <button 
            onClick={() => toggleMiLista(id)}
            className="w-8 h-8 rounded-full border-2 border-[#606060] flex items-center justify-center text-white hover:border-white transition-colors"
          >
            {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[#B3B3B3] mb-2">
          <span className="text-green-400 font-bold">{Math.floor(rating * 10)}% Match</span>
          <span className="border border-[#606060] px-1 rounded">HD</span>
        </div>
        <p className="text-[#B3B3B3] text-[11px] line-clamp-3 leading-relaxed">
          {description || 'Sin descripción disponible.'}
        </p>
      </div>
    </div>
  )
}