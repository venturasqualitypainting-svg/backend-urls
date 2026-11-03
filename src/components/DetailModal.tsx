import { X, Play, Plus, ThumbsUp, Check } from 'lucide-react'

interface DetailModalProps {
  channel: {
    id: string
    name: string
    url: string
    logo?: string
    group?: string
  } | null
  isOpen: boolean
  onClose: () => void
  onPlay: () => void
  onToggleMiLista: () => void
  isInMiLista: boolean
  similarChannels: Array<{
    id: string
    name: string
    url: string
    logo?: string
    group?: string
  }>
  onPlaySimilar: (url: string, title: string) => void
  onToggleSimilarMiLista: (id: string) => void
  isSimilarInMiLista: (id: string) => boolean
}

export default function DetailModal({
  channel, isOpen, onClose, onPlay, onToggleMiLista, isInMiLista,
  similarChannels, onPlaySimilar, onToggleSimilarMiLista, isSimilarInMiLista
}: DetailModalProps) {
  if (!isOpen || !channel) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-[#181818] rounded-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: 'scaleIn 0.3s ease-out' }}>
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors">
          <X className="w-5 h-5 text-white"/>
        </button>

        <div className="relative h-[60vh] bg-gradient-to-br from-[#2f2f2f] to-[#1a1a1a]">
          {channel.logo && <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain p-8"/>}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #181818 0%, transparent 50%)' }}/>

          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-white text-4xl font-bold mb-6">{channel.name}</h2>
            <div className="flex items-center gap-3">
              <button onClick={onPlay} className="flex items-center gap-2 bg-white text-black px-8 py-2 rounded font-bold hover:bg-white/80 transition-colors">
                <Play className="w-5 h-5" fill="black"/>Reproducir
              </button>
              <button onClick={onToggleMiLista} className={`w-10 h-10 border-2 rounded-full flex items-center justify-center transition-all ${isInMiLista ? 'bg-white border-white' : 'border-[#808080] hover:border-white'}`}>
                {isInMiLista ? <Check className="w-5 h-5 text-black"/> : <Plus className="w-5 h-5 text-white"/>}
              </button>
              <button className="w-10 h-10 border-2 border-[#808080] hover:border-white rounded-full flex items-center justify-center transition-colors">
                <ThumbsUp className="w-5 h-5 text-white"/>
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="text-[#46d369] font-medium">97% de coincidencia</span>
            <span className="text-[#808080]">2024</span>
            <span className="border border-[#808080] px-1 text-xs text-white">HD</span>
            <span className="bg-[#E50914] text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/>LIVE
            </span>
          </div>

          <p className="text-[#e5e5e5] mb-6">Disfruta de {channel.name} en vivo. Canal de alta calidad con transmisión continua las 24 horas del día.</p>

          <div className="grid grid-cols-2 gap-4 text-sm mb-8">
            <div>
              <span className="text-[#808080]">Grupo: </span>
              <span className="text-[#e5e5e5]">{channel.group || 'General'}</span>
            </div>
            <div>
              <span className="text-[#808080]">Género: </span>
              <span className="text-[#e5e5e5]">Televisión en vivo</span>
            </div>
          </div>

          {similarChannels.length > 0 && (
            <div>
              <h3 className="text-white text-2xl font-bold mb-4">Títulos similares</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {similarChannels.slice(0, 6).map((similar) => (
                  <div key={similar.id} className="bg-[#2f2f2f] rounded overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-[#E50914]/20 to-[#B00710]/20 flex items-center justify-center">
                      {similar.logo ? <img src={similar.logo} alt={similar.name} className="w-20 h-20 object-contain"/> : <span className="text-4xl">📺</span>}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#46d369] text-xs font-medium">97%</span>
                        <span className="border border-[#808080] px-1 text-[10px] text-white">HD</span>
                      </div>
                      <p className="text-white text-sm font-bold truncate mb-1">{similar.name}</p>
                      <p className="text-[#808080] text-xs truncate mb-3">{similar.group || 'General'}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onPlaySimilar(similar.url, similar.name)} className="flex-1 bg-white text-black py-1 rounded text-xs font-bold hover:bg-white/80 transition-colors flex items-center justify-center gap-1">
                          <Play className="w-3 h-3" fill="black"/>Reproducir
                        </button>
                        <button onClick={() => onToggleSimilarMiLista(similar.id)} className={`w-7 h-7 border-2 rounded-full flex items-center justify-center transition-all ${isSimilarInMiLista(similar.id) ? 'bg-white border-white' : 'border-[#808080] hover:border-white'}`}>
                          {isSimilarInMiLista(similar.id) ? <Check className="w-3 h-3 text-black"/> : <Plus className="w-3 h-3 text-white"/>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
