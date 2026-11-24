// src/components/NetflixCard.tsx
import { useState } from 'react'
import { Play, Trash2, Edit } from 'lucide-react'

interface NetflixCardProps {
  id: string
  title: string
  logo?: string
  poster?: string
  url: string
  group?: string
  isLive?: boolean
  onPlay: () => void
  isAdmin?: boolean
  onDelete?: () => void
  onEdit?: () => void
  index?: number
}

export default function NetflixCard({ 
  title, logo, poster, group, isLive = false, 
  onPlay, isAdmin = false, onDelete, onEdit 
}: NetflixCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const displayImage = logo || poster || 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&auto=format&fit=crop'

  return (
    <div 
      className="relative flex-none w-full cursor-pointer group transition-transform duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
    >
      <div className="relative aspect-video rounded-md overflow-hidden bg-[#2F2F2F] shadow-lg">
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&auto=format&fit=crop' }}
        />
        
        {isLive && (
          <div className="absolute top-2 left-2 bg-[#E50914] px-2 py-0.5 rounded text-[10px] font-bold text-white z-10">
            EN VIVO
          </div>
        )}

        {group && (
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium text-white z-10 max-w-[70%] truncate">
            {group}
          </div>
        )}

        {/* ✅ ADMIN BUTTONS: Edit and Delete */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1 z-20">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                className="w-8 h-8 bg-[#4A90E2] hover:bg-[#357ABD] rounded-full flex items-center justify-center transition-all shadow-lg"
                title="Editar URL/Grupo"
              >
                <Edit className="w-4 h-4 text-white" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="w-8 h-8 bg-[#E50914] hover:bg-[#F40612] rounded-full flex items-center justify-center transition-all shadow-lg"
                title="Eliminar canal"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        )}

        {/* Play Overlay */}
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 flex items-center justify-center ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      </div>
      <p className="text-white text-xs font-medium mt-2 truncate">{title}</p>
    </div>
  )
}