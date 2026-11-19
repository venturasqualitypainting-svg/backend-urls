import { useState } from 'react'
import { Search, Trash2, Tv } from 'lucide-react'
import { useUserAuth } from '../context/UserAuthContext'
import { useContent } from '../context/ContentContext'
import NetflixCard from './NetflixCard'

interface ContentSectionProps {
  onPlay: (url: string, title: string, index?: number) => void
  title: string
  icon: any
  iconColor: string
  category: 'kids' | 'deportes' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico' | 'adultos'
}

export default function ContentSection({ onPlay, title, icon: Icon, iconColor, category }: ContentSectionProps) {
  const { isUserAdmin } = useUserAuth()
  const { channels, movies, loading, refreshData, removeChannel } = useContent()
  const [searchTerm, setSearchTerm] = useState('')

  const categoryChannels = channels.filter(c => c.category === category)
  const categoryMovies = movies.filter(m => m.category === category)

  console.log(`📊 [${title}] Total en BD: ${channels.length} | Filtrados en esta categoría: ${categoryChannels.length}`)

  const items = [
    ...categoryChannels.map(c => ({
      id: c.id,
      title: c.name,
      url: c.url,
      logo: c.logo,
      group: c.group,
      type: 'channel' as const
    })),
    ...categoryMovies.map(m => ({
      id: m.id,
      title: m.title,
      url: m.url,
      poster: m.poster,
      genre: m.genre,
      type: 'movie' as const
    }))
  ]

  const filteredItems = items.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return (
      <div className="pt-8 px-4 md:px-12 flex items-center gap-3">
        <Icon className={`w-8 h-8 ${iconColor}`} />
        <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
        <span className="text-[#808080] ml-4">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="pt-8">
      <div className="px-4 md:px-12 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
          <div className="flex items-center gap-3">
            <Icon className={`w-8 h-8 ${iconColor}`} />
            <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-[#2F2F2F] text-white border border-[#3F3F3F]">
            <Tv className="w-4 h-4" /> Guía EPG
          </button>
        </div>
        <p className="text-[#808080] text-sm">{items.length} contenidos disponibles</p>
      </div>

      <div className="px-4 md:px-12 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar en ${title.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm"
            />
          </div>
          {isUserAdmin && (
            <button 
              onClick={refreshData} 
              className="px-4 py-2.5 bg-[#4A90E2] hover:bg-[#357ABD] text-white rounded-md text-sm font-bold transition-colors flex items-center gap-2"
            >
              🔄 Recargar Datos
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="px-4 md:px-12">
          <div className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-md p-12 text-center">
            <p className="text-[#808080] text-lg mb-2">No hay contenidos en esta categoría</p>
            {channels.length === 0 && (
              <p className="text-[#E50914] text-sm font-bold mt-2">
                ⚠️ La base de datos está devolviendo 0 canales en total.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 md:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {filteredItems.map((item, index) => (
              <NetflixCard
                key={item.id}
                id={item.id}
                title={item.title}
                logo={item.logo}
                poster={item.poster}
                url={item.url}
                group={item.group || item.genre}
                isLive={item.type === 'channel'}
                onPlay={() => onPlay(item.url, item.title, index)}
                isAdmin={isUserAdmin}
                onDelete={isUserAdmin && item.type === 'channel' ? () => removeChannel(item.id) : undefined}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
