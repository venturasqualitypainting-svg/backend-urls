// src/components/ContentSection.tsx
// src/components/ContentSection.tsx
import { useState, useEffect } from 'react'
import { Search, CheckSquare, Square, Trash2, Heart, Tv } from 'lucide-react'
import { useUserAuth } from '../context/UserAuthContext'
import { useContent } from '../context/ContentContext'
import NetflixCard from './NetflixCard'
import EPG from './EPG'
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
  // 🚨 USE NEW USER AUTH CONTEXT TO GET ADMIN STATUS
  const { isUserAdmin } = useUserAuth()
  const { channels, movies, removeChannel, removeMovie } = useContent()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [favorites, setFavorites] = useState<string[]>([])
  const [showEPG, setShowEPG] = useState(false)

  useEffect(() => {
    const savedFavorites = localStorage.getItem(`tunetv_favorites_${category}`)
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [category])

  useEffect(() => {
    localStorage.setItem(`tunetv_favorites_${category}`, JSON.stringify(favorites))
  }, [favorites, category])

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

  const isFavorite = (id: string) => favorites.includes(id)

  const categoryChannels = channels.filter(c => c.category === category)
  const categoryMovies = movies.filter(m => m.category === category)
  
  const items = [
    ...categoryChannels.map(c => ({
      id: c.id,
      title: c.name,
      year: new Date().getFullYear(),
      genre: c.group || category,
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
  const favoriteItems = items.filter(i => favorites.includes(i.id))

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
      {/* Header */}
      <div className="px-4 md:px-12 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
          <div className="flex items-center gap-3">
            <Icon className={`w-8 h-8 ${iconColor}`}/>
            <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={() => setShowEPG(!showEPG)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              showEPG 
                ? 'bg-[#E50914] text-white' 
                : 'bg-[#2F2F2F] hover:bg-[#3F3F3F] text-white border border-[#3F3F3F]'
            }`}
          >
            <Tv className="w-4 h-4"/>
            {showEPG ? 'Ver Canales' : 'Guía de Canales (EPG)'}
          </button>
        </div>
        <p className="text-[#808080] text-sm">{items.length} contenidos disponibles</p>
      </div>

      {/* EPG View */}
      {showEPG ? (
        <EPG 
          category={category} 
          categoryTitle={title} 
          onPlay={onPlay}
        />
      ) : (
        <>
          {/* Search & Admin Actions */}
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
              
              {/* 🚨 ADMIN ONLY: Selection and Delete Controls (NOW USING isUserAdmin) */}
              {isUserAdmin && (
                <div className="flex gap-2 flex-wrap">
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
              )}
            </div>
          </div>

          {/* 🌟 MIS FAVORITOS ROW */}
          {favoriteItems.length > 0 && (
            <div className="px-4 md:px-12 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-[#E50914] fill-[#E50914]"/>
                <h3 className="text-white text-xl font-bold">Mis Favoritos</h3>
                <span className="text-[#808080] text-sm">({favoriteItems.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {favoriteItems.map((item, index) => (
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
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    isFavorite={isFavorite(item.id)}
                    isSelected={selectedItems.has(item.id)}
                    onToggleSelection={(e) => toggleItemSelection(item.id, e)}
                    isAdmin={isUserAdmin}
                    onDelete={isUserAdmin ? () => {
                      if (item.type === 'channel') removeChannel(item.id)
                      else removeMovie(item.id)
                    } : undefined}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          {filteredItems.length === 0 ? (
            <div className="px-4 md:px-12">
              <SkeletonRow/>
            </div>
          ) : (
            <div className="px-4 md:px-12">
              <h3 className="text-white text-xl font-bold mb-4">
                {searchTerm ? `Resultados para "${searchTerm}"` : title}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
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
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    isFavorite={isFavorite(item.id)}
                    isSelected={selectedItems.has(item.id)}
                    onToggleSelection={(e) => toggleItemSelection(item.id, e)}
                    isAdmin={isUserAdmin}
                    onDelete={isUserAdmin ? () => {
                      if (item.type === 'channel') removeChannel(item.id)
                      else removeMovie(item.id)
                    } : undefined}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}