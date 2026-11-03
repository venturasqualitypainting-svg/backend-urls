import { Play, Info } from 'lucide-react'

interface BillboardProps {
  title: string
  description: string
  logo?: string
  onPlay: () => void
  onMoreInfo: () => void
}

export default function Billboard({ title, description, logo, onPlay, onMoreInfo }: BillboardProps) {
  return (
    <div className="relative w-full h-[85vh] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: logo ? `url(${logo})` : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}/>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(77deg, rgba(0,0,0,.6) 0, rgba(0,0,0,0) 85%)' }}/>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #141414 0%, transparent 50%)' }}/>

      <div className="absolute bottom-[20%] left-4 md:left-12 w-[40%] min-w-[300px] max-w-[600px]">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-[#E50914] text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <span className="text-lg font-black">1</span>
            <span className="text-[8px]">TOP</span>
          </div>
          <span className="text-[#e5e5e5] text-sm font-medium">N.º 1 hoy</span>
        </div>

        <h1 className="text-white font-bold mb-4" style={{ fontSize: '3vw', lineHeight: '1.1' }}>{title}</h1>
        <p className="text-[#e5e5e5] mb-6 line-clamp-2" style={{ fontSize: '1.1vw' }}>{description}</p>

        <div className="flex items-center gap-3">
          <button onClick={onPlay} className="flex items-center gap-2 bg-white text-black px-8 py-2 rounded font-bold hover:bg-white/80 transition-colors">
            <Play className="w-5 h-5" fill="black"/>Reproducir
          </button>
          <button onClick={onMoreInfo} className="flex items-center gap-2 bg-[rgba(109,109,110,0.7)] text-white px-6 py-2 rounded font-bold hover:bg-[rgba(109,109,110,0.5)] transition-colors">
            <Info className="w-5 h-5"/>Más información
          </button>
        </div>
      </div>
    </div>
  )
}
