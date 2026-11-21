import { useState } from 'react'
import { Search, Tv, X, Save } from 'lucide-react'
import { useUserAuth } from '../context/UserAuthContext'
import { useContent, Channel } from '../context/ContentContext'
import NetflixCard from './NetflixCard'

interface ContentSectionProps {
  onPlay: (url: string, title: string, index?: number) => void
  title: string
  icon: any
  iconColor: string
  category: 'kids' | 'deportes' | 'entretenimiento' | 'historia' | 'premium' | 'cineclasico' | 'adultos'
}

// ✅ MODAL PARA EDITAR URL Y GRUPO DEL CANAL
function EditChannelModal({ 
  channel, 
  onClose, 
  onSave 
}: { 
  channel: Channel, 
  onClose: () => void, 
  onSave: (id: string, url: string, group: string, name: string) => void 
}) {
  const [newUrl, setNewUrl] = useState(channel.url)
  const [newGroup, setNewGroup] = useState(channel.group || '')
  const [newName, setNewName] = useState(channel.name)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!newUrl.trim()) {
      alert('La URL es obligatoria')
      return
    }
    setIsSaving(true)
    await onSave(channel.id, newUrl, newGroup, newName)
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#181818] rounded-lg shadow-2xl border border-[#2F2F2F] w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-[#4A90E2]">✏️</span> Editar Canal
            </h2>
            <button onClick={onClose} className="text-[#808080] hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-[#808080] font-medium">Nombre del Canal</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: ESPN HD"
                className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#4A90E2] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#808080] font-medium">URL del Stream *</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://ejemplo.com/stream.m3u8"
                className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#4A90E2] outline-none font-mono"
              />
              <p className="text-[10px] text-[#808080]">Pega aquí la nueva URL si el canal se cayó</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#808080] font-medium">Grupo / Tipo de Canal</label>
              <input
                type="text"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="Ej: Fútbol, Noticias, Infantil, Premium..."
                className="w-full px-3 py-2 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm focus:border-[#4A90E2] outline-none"
              />
              <p className="text-[10px] text-[#808080]">Clasifica el canal manualmente para identificarlo fácilmente</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#2F2F2F] hover:bg-[#3F3F3F] text-white rounded-md font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !newUrl.trim()}
              className="flex-1 py-3 bg-[#4A90E2] hover:bg-[#357ABD] text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Guardando...</>
              ) : (
                <><Save className="w-4 h-4"/>Guardar Cambios</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContentSection({ onPlay, title, icon: Icon, iconColor, category }: ContentSectionProps) {
  const { isUserAdmin } = useUserAuth()
  const { channels, movies, loading, refreshData, removeChannel, updateChannel } = useContent()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

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
      type: 'channel' as const,
      raw: c
    })),
    ...categoryMovies.map(m => ({
      id: m.id,
      title: m.title,
      url: m.url,
      poster: m.poster,
      group: m.genre,
      type: 'movie' as const
    }))
  ]

  const filteredItems = items.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleDeleteChannel = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este canal?')) {
      await removeChannel(id)
      setSuccessMsg('✅ Canal eliminado')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const handleEditChannel = async (id: string, url: string, group: string, name: string) => {
    const result = await updateChannel(id, { url, group, name })
    if (result?.success) {
      setSuccessMsg('✅ ' + result.message)
      setEditingChannel(null)
      setTimeout(() => setSuccessMsg(''), 3000)
    } else {
      alert('❌ ' + (result?.message || 'Error al actualizar'))
    }
  }

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
      {editingChannel && (
        <EditChannelModal
          channel={editingChannel}
          onClose={() => setEditingChannel(null)}
          onSave={handleEditChannel}
        />
      )}

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

      {successMsg && (
        <div className="px-4 md:px-12 mb-4">
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-md p-3">
            <span>✓</span>{successMsg}
          </div>
        </div>
      )}

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
                group={item.group}
                isLive={item.type === 'channel'}
                onPlay={() => onPlay(item.url, item.title, index)}
                isAdmin={isUserAdmin}
                onDelete={isUserAdmin && item.type === 'channel' ? () => handleDeleteChannel(item.id) : undefined}
                onEdit={isUserAdmin && item.type === 'channel' && item.raw ? () => setEditingChannel(item.raw) : undefined}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
