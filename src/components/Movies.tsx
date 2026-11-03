import { useState } from 'react'
import { Search, CheckSquare, Square, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useContent } from '../context/ContentContext'
import { useMiLista } from '../hooks/useMiLista'
import Row from './Row'
import NetflixCard from './NetflixCard'
import { SkeletonRow } from './Skeleton'

interface MoviesProps {
  onPlayMovie: (url: string, title: string, index?: number) => void
}

export default function Movies({ onPlayMovie }: MoviesProps) {
  const { isAdmin } = useAuth()
  const { movies, removeMovie } = useContent()
  const { miLista, toggleMiLista, isInMiLista } = useMiLista()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set())

  const moviesList = movies.filter(m => m.category === 'movies')
  const filteredMovies = moviesList.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))
  const miListaMovies = moviesList.filter(m => miLista.includes(m.id))

  const toggleMovieSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = new Set(selectedMovies)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedMovies(newSelected)
  }

  const deleteSelected = () => {
    if (selectedMovies.size === 0) return
    if (confirm(`¿Eliminar ${selectedMovies.size} película(s)?`)) {
      selectedMovies.forEach(id => removeMovie(id))
      setSelectedMovies(new Set())
    }
  }

  return (
    <div className="pt-8">
      <div className="px-4 md:px-12 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Movies & Series</h2>
        <p className="text-[#808080] text-sm">{moviesList.length} títulos disponibles</p>
      </div>

      <div className="px-4 md:px-12 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]"/>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar películas y series..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#2F2F2F] border border-[#3F3F3F] rounded-md text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelectedMovies(new Set(filteredMovies.map(m => m.id)))} className="px-4 py-2.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm transition-colors flex items-center gap-2">
              <CheckSquare className="w-4 h-4"/>Seleccionar todos
            </button>
            {selectedMovies.size > 0 && (
              <>
                <button onClick={() => setSelectedMovies(new Set())} className="px-4 py-2.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-[#3F3F3F] rounded-md text-white text-sm transition-colors flex items-center gap-2">
                  <Square className="w-4 h-4"/>Deseleccionar
                </button>
                <button onClick={deleteSelected} className="px-4 py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md flex items-center gap-2 transition-colors">
                  <Trash2 className="w-4 h-4"/>Eliminar ({selectedMovies.size})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {miListaMovies.length > 0 && (
        <Row title="Mi Lista">
          {miListaMovies.map((movie, index) => (
            <NetflixCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              poster={movie.poster}
              url={movie.url}
              group={movie.genre}
              isLive={false}
              onPlay={() => onPlayMovie(movie.url, movie.title, index)}
              onToggleMiLista={() => toggleMiLista(movie.id)}
              isInMiLista={isInMiLista(movie.id)}
              isSelected={selectedMovies.has(movie.id)}
              onToggleSelection={(e) => toggleMovieSelection(movie.id, e)}
              onDelete={isAdmin ? () => removeMovie(movie.id) : undefined}
              index={index}
            />
          ))}
        </Row>
      )}

      {moviesList.length === 0 ? (
        <SkeletonRow/>
      ) : (
        <Row title="Movies & Series">
          {filteredMovies.map((movie, index) => (
            <NetflixCard
              key={movie.id}
              id={movie.id}
              title={movie.title}
              poster={movie.poster}
              url={movie.url}
              group={movie.genre}
              isLive={false}
              onPlay={() => onPlayMovie(movie.url, movie.title, index)}
              onToggleMiLista={() => toggleMiLista(movie.id)}
              isInMiLista={isInMiLista(movie.id)}
              isSelected={selectedMovies.has(movie.id)}
              onToggleSelection={(e) => toggleMovieSelection(movie.id, e)}
              onDelete={isAdmin ? () => removeMovie(movie.id) : undefined}
              index={index}
            />
          ))}
        </Row>
      )}

      {searchTerm === '' && [...new Set(moviesList.map(m => m.genre))].slice(0, 3).map(genre => {
        const genreMovies = moviesList.filter(m => m.genre === genre)
        if (genreMovies.length === 0) return null
        return (
          <Row key={genre} title={genre}>
            {genreMovies.map((movie, index) => (
              <NetflixCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                poster={movie.poster}
                url={movie.url}
                group={movie.genre}
                isLive={false}
                onPlay={() => onPlayMovie(movie.url, movie.title, index)}
                onToggleMiLista={() => toggleMiLista(movie.id)}
                isInMiLista={isInMiLista(movie.id)}
                isSelected={selectedMovies.has(movie.id)}
                onToggleSelection={(e) => toggleMovieSelection(movie.id, e)}
                onDelete={isAdmin ? () => removeMovie(movie.id) : undefined}
                index={index}
              />
            ))}
          </Row>
        )
      })}
    </div>
  )
}
