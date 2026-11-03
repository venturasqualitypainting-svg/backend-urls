import { useEffect, useRef, useState } from 'react'
import { X, Volume2, VolumeX, Maximize, Play, Pause, AlertCircle, SkipBack, SkipForward, Cast } from 'lucide-react'
import Hls from 'hls.js'

interface VideoPlayerProps {
  url: string
  title: string
  onClose: () => void
  channels?: Array<{ url: string; title: string }>
  currentIndex?: number
  onChannelChange?: (index: number) => void
}

export default function VideoPlayer({ url, title, onClose, channels = [], currentIndex = 0, onChannelChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const hasChannels = channels.length > 0
  const canGoPrevious = hasChannels && currentIndex > 0
  const canGoNext = hasChannels && currentIndex < channels.length - 1

  const handlePreviousChannel = () => {
    if (canGoPrevious && onChannelChange) onChannelChange(currentIndex - 1)
  }

  const handleNextChannel = () => {
    if (canGoNext && onChannelChange) onChannelChange(currentIndex + 1)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setIsLoading(true)
    setError(null)

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const isHls = url.includes('.m3u8')

    if (isHls && Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play()
        setIsPlaying(true)
        setIsLoading(false)
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Error al cargar el stream')
          setIsLoading(false)
        }
      })
    } else {
      video.src = url
      video.play().catch(() => {})
      setIsLoading(false)
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy()
    }
  }, [url])

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="w-full h-full relative">
        <video ref={videoRef} className="w-full h-full object-contain" playsInline onClick={togglePlay}/>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="w-16 h-16 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin"/>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-[#E50914] mx-auto mb-4"/>
              <p className="text-white text-lg">{error}</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-[#E50914] text-white rounded-md">Volver</button>
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="text-white hover:text-[#808080]">
            <X className="w-6 h-6"/>
          </button>
          <h2 className="text-white font-bold text-lg truncate">{title}</h2>
          <button className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20">
            <Cast className="w-5 h-5"/>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-4">
            {hasChannels && (
              <button onClick={handlePreviousChannel} disabled={!canGoPrevious} className="text-white disabled:opacity-30">
                <SkipBack className="w-6 h-6"/>
              </button>
            )}
            <button onClick={togglePlay} className="text-white">
              {isPlaying ? <Pause className="w-7 h-7"/> : <Play className="w-7 h-7"/>}
            </button>
            <button onClick={toggleMute} className="text-white">
              {isMuted ? <VolumeX className="w-6 h-6"/> : <Volume2 className="w-6 h-6"/>}
            </button>
            {hasChannels && (
              <button onClick={handleNextChannel} disabled={!canGoNext} className="text-white disabled:opacity-30">
                <SkipForward className="w-6 h-6"/>
              </button>
            )}
            <div className="flex-1"/>
            {hasChannels && (
              <div className="text-[#808080] text-sm">
                <span className="text-white font-medium">{currentIndex + 1}</span> / {channels.length}
              </div>
            )}
            <button onClick={toggleFullscreen} className="text-white">
              <Maximize className="w-6 h-6"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
