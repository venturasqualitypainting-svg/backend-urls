import { useState } from 'react'
import { Play, Plus, ThumbsUp, Check, X } from 'lucide-react'

interface NetflixCardProps {
  id: string
  title: string
  logo?: string
  poster?: string
  url: string
  group?: string
  isLive?: boolean
  match?: number
  onPlay: () => void
  onToggleMiLista: () => void
  isInMiLista: boolean
  isSelected?: boolean
  onToggleSelection?: (e: React.MouseEvent) => void
  onDelete?: () => void
  onShowDetails?: () => void
  index?: number
}

export default function NetflixCard({
  id, title, logo, poster, url, group, isLive = false, match = 97,
  onPlay, onToggleMiLista, isInMiLista, isSelected = false, onToggleSelection,
  onDelete, onShowDetails, index = 0
}: NetflixCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative group flex-shrink-0 w-[16vw] min-w-[200px] transition-all duration-300 ease-in-out ${isSelected ? 'ring-2 ring-[#E50914]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        zIndex: isHovered ? 10 : 1,
        transform: isHovered ? 'scale(1.35)' : 'scale(1)',
        transformOrigin: index === 0 ? 'left center' : 'center center'
      }}
    >
      <div className="relative aspect-video rounded-md overflow-hidden cursor-pointer bg-[#2f2f2f]" onClick={onPlay}>
        {logo ? (
          <img src={logo} alt={title} className="w-full h-full object-contain p-4" onError={(e) => { e.currentTarget.style.display = 'none' }}/>
        ) : poster ? (
          <div className="w-full h-full flex items-center justify-center text-5xl">{poster}</div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E50914]/20 to-[#B00710]/20">
            <span className="text-4xl text-[#E50914]/50">📺</span>
          </div>
        )}

        {index === 0 && (
          <div className="absolute top-2 left-2 bg-[#E50914] text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
            <span className="text-lg font-black">1</span>
            <span className="text-[8px]">TOP</span>
          </div>
        )}

        {isLive && (
          <div className="absolute top-2 right-2 bg-[#E50914] text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/>LIVE
          </div>
        )}

        {onToggleSelection && (
          <button
            onClick={onToggleSelection}
            className="absolute top-2 left-2 z-20 w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ backgroundColor: isSelected ? '#E50914' : 'rgba(0,0,0,0.7)', border: isSelected ? 'none' : '2px solid rgba(255,255,255,0.7)' }}
          >
            {isSelected && <Check className="w-4 h-4 text-white"/>}
          </button>
        )}

        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar?')) onDelete() }}
            className="absolute top-10 right-2 w-6 h-6 bg-black/70 hover:bg-[#E50914] rounded-full flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-white"/>
          </button>
        )}
      </div>

      {isHovered && (
        <div className="absolute top-full left-0 right-0 bg-[#181818] rounded-b-md shadow-2xl p-3 transition-all duration-300" style={{ boxShadow: '0 5px 20px rgba(0,0,0,0.8)' }}>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={onPlay} className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-white/80 transition-colors">
              <Play className="w-4 h-4 text-black ml-0.5" fill="black"/>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onToggleMiLista() }} className={`w-8 h-8 border-2 rounded-full flex items-center justify-center transition-all ${isInMiLista ? 'bg-white border-white' : 'border-[#808080] hover:border-white'}`}>
              {isInMiLista ? <Check className="w-4 h-4 text-black"/> : <Plus className="w-4 h-4 text-white"/>}
            </button>
            <button className="w-8 h-8 border-2 border-[#808080] hover:border-white rounded-full flex items-center justify-center transition-colors">
              <ThumbsUp className="w-4 h-4 text-white"/>
            </button>
            {onShowDetails && (
              <button onClick={(e) => { e.stopPropagation(); onShowDetails() }} className="ml-auto w-8 h-8 border-2 border-[#808080] hover:border-white rounded-full flex items-center justify-center transition-colors">
                <span className="text-white text-sm">ⓘ</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="text-[#46d369] font-medium">{match}% coincidencia</span>
            {isLive && <span className="border border-[#808080] px-1 text-[10px] text-white">LIVE</span>}
            <span className="border border-[#808080] px-1 text-[10px] text-white">HD</span>
          </div>

          <p className="text-white text-xs font-bold truncate">{title}</p>
          {group && <p className="text-[#808080] text-[10px] truncate">{group}</p>}
        </div>
      )}
    </div>
  )
}
