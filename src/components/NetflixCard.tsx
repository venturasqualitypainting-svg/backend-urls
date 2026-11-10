import { useState } from 'react'
import { Play, Plus, Check, Heart, Trash2, Info } from 'lucide-react'

interface NetflixCardProps {
  id: string
  title: string
  logo?: string
  poster: string
  url: string
  group?: string
  isLive?: boolean
  onPlay: () => void
  onToggleFavorite?: () => void
  isFavorite?: boolean
  isSelected?: boolean
  onToggleSelection?: (e: React.MouseEvent) => void
  isAdmin?: boolean
  onDelete?: () => void
  index?: number
}

export default function NetflixCard({
  id,
  title,
  logo,
  poster,
  url,
  group,
  isLive = false,
  onPlay,
  onToggleFavorite,
  isFavorite = false,
  isSelected = false,
  onToggleSelection,
  isAdmin = false,
  onDelete,
  index
}: NetflixCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const displayImage = logo && !logo.startsWith('📺') ? logo : (poster && !poster.startsWith('📺') ? poster : 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&auto=format&fit=crop')

  return (
    <div
      className="relative flex-none w-full aspect-[2/3] rounded-md overflow-hidden bg-[#2F2F2F] shadow-lg cursor-pointer group transition-transform duration-300 hover:scale-105 hover:z-20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
    >
      {/* Image */}
      <img
        src={displayImage}
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&auto=format&fit=crop'
        }}
      />

      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-2 left-2 bg-[#E50914] px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1 z-10">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/>
          EN VIVO
        </div>
      )}

      {/* Selection Checkbox (Admin only) */}
      {isAdmin && isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-[#E50914] rounded-full flex items-center justify-center z-10">
          <Check className="w-4 h-4 text-white"/>
        </div>
      )}

      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent transition-opacity duration-300 flex flex-col justify-end p-3 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <h3 className="text-white text-sm font-bold mb-2 line-clamp-2">{title}</h3>
        {group && <p className="text-[#B3B3B3] text-xs mb-2 truncate">{group}</p>}
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onPlay() }}
            className="flex-1 bg-white text-black py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
          >
            <Play className="w-3 h-3 fill-black"/> Play
          </button>
          
          {/* 🌟 FAVORITE HEART BUTTON - Visible for ALL users */}
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                isFavorite 
                  ? 'bg-[#E50914] border-[#E50914] text-white' 
                  : 'border-white/60 text-white hover:border-white'
              }`}
              title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`}/>
            </button>
          )}

          {/* Admin Delete */}
          {isAdmin && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center text-white hover:border-[#E50914] hover:text-[#E50914] transition-colors"
            >
              <Trash2 className="w-4 h-4"/>
            </button>
          )}
        </div>
      </div>

      {/* Title below (always visible) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pointer-events-none">
        <p className="text-white text-xs font-medium truncate">{title}</p>
      </div>
    </div>
  )
}