import { useState } from 'react'
import { Search, CheckSquare, Square, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'
import { useMiLista } from '../hooks/useMiLista'
import Row from './Row'
import NetflixCard from './NetflixCard'
import { SkeletonRow } from './Skeleton'

interface ContentSectionProps {
  onPlay: (url: string, title: string, index?: number) => void
  title: string
  icon: any
  iconColor: string
  borderColor: string
  gradientFrom: string
  gradientTo: string
  category: 'kids' | 'deportes' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico'
}

export default function ContentSection({ onPlay, title, icon: Icon, iconColor, category }: ContentSectionProps) {
  const { isAdmin } = useAuth()
  const { channels, movies, removeChannel, removeMovie } = useContent()
  const { miLista, toggleMiLista, isInMiLista } = useMiLista()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const categoryChannels = channels.filter(c => c.category === category)
  const categoryMovies = movies.filter(m => m.category === category)
  
  const items = [
    ...categoryChannels.map(c => ({
      id: c.id,
      title: c.name,
      year: new Date().getFullYear(),
      genre: c.group || 'General',
      rating: 7.5,
      poster: '📺',
      url: c.url,
      logo: c.logo,
      type: 'channel' as const
    })),
    ...categoryMovies.map(m => ({
      id: m.id,
      title: m.title,
      year: m.year,
      genre: m.genre,
      rating: m.rating,
      poster: m.poster,
      url: m.url,
      logo: undefined,
      type: 'movie' as const
    }))
  ]

  const filteredItems = items.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))
  const miListaItems = items.filter(i => miLista.includes(i.id))

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

  return (
    <div className="pt-8">
      <div className="px-4 md:px-12 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`w-8 h-8 ${iconColor}`}/>
          <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
        </div>
        <p className="text-[#808080] text-sm">{items.length} contenidos disponibles</p>
      </div>

      <div className="px-4 md:px-12 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]"/>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar en ${title.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelectedItems(new Set(filteredItems.map(i => i.id)))} className="px-4 py-2.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm transition-colors flex items-center gap-2">
              <CheckSquare className="w-4 h-4"/>Seleccionar todos
            </button>
            {selectedItems.size > 0 && (
              <>
                <button onClick={() => setSelectedItems(new Set())} className="px-4 py-2.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm transition-colors flex items-center gap-2">
                  <Square className="w-4 h-4"/>Deseleccionar
                </button>
                <button onClick={deleteSelected} className="px-4 py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md flex items-center gap-2 transition-colors">
                  <Trash2 className="w-4 h-4"/>Eliminar ({selectedItems.size})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {miListaItems.length > 0 && (
        <Row title="Mi Lista">
          {miListaItems.map((item, index) => (
            <NetflixCard
              key={item.id}
              id={item.id}
              title={item.title}
              logo={item.logo}
              poster={item.poster}
              url={item.url}
              group={item.genre}
              isLive={item.type === 'channel'}
              onPlay={() => onPlay(item.url, item.title, index)}
              onToggleMiLista={() => toggleMiLista(item.id)}
              isInMiLista={isInMiLista(item.id)}
              isSelected={selectedItems.has(item.id)}
              onToggleSelection={(e) => toggleItemSelection(item.id, e)}
              onDelete={isAdmin ? () => {
                if (item.type === 'channel') removeChannel(item.id)
                else removeMovie(item.id)
              } : undefined}
              index={index}
            />
          ))}
        </Row>
      )}

      {items.length === 0 ? (
        <SkeletonRow/>
      ) : (
        <Row title={title}>
          {filteredItems.map((item, index) => (
            <NetflixCard
              key={item.id}
              id={item.id}
              title={item.title}
              logo={item.logo}
              poster={item.poster}
              url={item.url}
              group={item.genre}
              isLive={item.type === 'channel'}
              onPlay={() => onPlay(item.url, item.title, index)}
              onToggleMiLista={() => toggleMiLista(item.id)}
              isInMiLista={isInMiLista(item.id)}
              isSelected={selectedItems.has(item.id)}
              onToggleSelection={(e) => toggleItemSelection(item.id, e)}
              onDelete={isAdmin ? () => {
                if (item.type === 'channel') removeChannel(item.id)
                else removeMovie(item.id)
              } : undefined}
              index={index}
            />
          ))}
        </Row>
      )}

      {searchTerm === '' && [...new Set(items.map(i => i.genre).filter(Boolean))].slice(0, 3).map(genre => {
        const genreItems = items.filter(i => i.genre === genre)
        if (genreItems.length === 0) return null
        return (
          <Row key={genre} title={genre}>
            {genreItems.map((item, index) => (
              <NetflixCard
                key={item.id}
                id={item.id}
                title={item.title}
                logo={item.logo}
                poster={item.poster}
                url={item.url}
                group={item.genre}
                isLive={item.type === 'channel'}
                onPlay={() => onPlay(item.url, item.title, index)}
                onToggleMiLista={() => toggleMiLista(item.id)}
                isInMiLista={isInMiLista(item.id)}
                isSelected={selectedItems.has(item.id)}
                onToggleSelection={(e) => toggleItemSelection(item.id, e)}
                onDelete={isAdmin ? () => {
                  if (item.type === 'channel') removeChannel(item.id)
                  else removeMovie(item.id)
                } : undefined}
                index={index}
              />
            ))}
          </Row>
        )
      })}
    </div>
  )
}
