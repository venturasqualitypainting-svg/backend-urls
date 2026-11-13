import { Play, X } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'

interface ContinueWatchingRowProps {
  onPlay: (url: string, title: string, startTime?: number) => void
}

export default function ContinueWatchingRow({ onPlay }: ContinueWatchingRowProps) {
  const { watchHistory, removeFromHistory } = useProfile()

  if (watchHistory.length === 0) return null

  const progressPercent = (currentTime: number, duration: number) => {
    if (!duration || duration === 0) return 0
    return Math.min(100, Math.max(0, (currentTime / duration) * 100))
  }

  return (
    <div className="px-4 md:px-12 mb-8">
      <h3 className="text-white text-xl font-bold mb-4">Seguir Viendo</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {watchHistory.map((item) => {
          const percent = progressPercent(item.currentTime, item.duration)
          return (
            <div key={item.id} className="relative flex-none w-[200px] md:w-[240px] group cursor-pointer">
              <div 
                className="relative aspect-video rounded-md overflow-hidden bg-[#2F2F2F] shadow-lg"
                onClick={() => onPlay(item.url, item.title, item.currentTime)}
              >
                <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 text-white fill-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div 
                    className="h-full bg-[#E50914] transition-all duration-300" 
                    style={{ width: `\${percent}%` }} 
                  />
                </div>
              </div>
              <div className="mt-2 flex items-start justify-between">
                <p className="text-white text-sm font-medium truncate flex-1">{item.title}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFromHistory(item.id) }}
                  className="text-[#808080] hover:text-white ml-2 p-1"
                  title="Quitar de Seguir Viendo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
