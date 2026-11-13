import { useState, useEffect, useRef } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Cast, SkipBack, SkipForward } from 'lucide-react'
import Hls from 'hls.js'
import { useProfile } from '../context/ProfileContext'

interface VideoPlayerProps {
  url: string
  title: string
  poster?: string
  startTime?: number
  onClose: () => void
  channels?: { url: string; title: string }[]
  currentIndex?: number
  onChannelChange?: (index: number) => void
}

export default function VideoPlayer({ url, title, poster, startTime = 0, onClose, channels = [], currentIndex = 0, onChannelChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { updateWatchHistory } = useProfile()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isCasting, setIsCasting] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveRef = useRef<number>(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 })
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (startTime > 0) video.currentTime = startTime
        video.play().catch(() => {})
        setIsPlaying(true)
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      video.addEventListener('loadedmetadata', () => {
        if (startTime > 0) video.currentTime = startTime
        video.play().catch(() => {})
        setIsPlaying(true)
      })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [url, startTime])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime)
      const now = Date.now()
      if (now - lastSaveRef.current > 5000) {
        lastSaveRef.current = now
        if (video.duration && video.duration > 0) {
          updateWatchHistory({
            id: url,
            title,
            url,
            poster: poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop',
            currentTime: video.currentTime,
            duration: video.duration
          })
        }
      }
    }
    const updateDuration = () => setDuration(video.duration)
    
    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('pause', () => {
      if (video.duration && video.duration > 0) {
        updateWatchHistory({
          id: url,
          title,
          url,
          poster: poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop',
          currentTime: video.currentTime,
          duration: video.duration
        })
      }
    })

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [url, title, poster, updateWatchHistory])

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
    setIsMuted(video.muted)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleCast = async () => {
    const video = videoRef.current
    if (!video) return

    if (video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === 'function') {
      try {
        video.webkitSetPresentationMode('picture-in-picture')
        return
      } catch (e) {
        console.log('AirPlay not available')
      }
    }

    if (window.chrome && window.chrome.cast) {
      try {
        const castSession = window.chrome.cast.session.getSession()
        if (castSession) {
          const mediaInfo = new window.chrome.cast.media.MediaInfo(url, 'application/x-mpegurl')
          const request = new window.chrome.cast.media.LoadRequest(mediaInfo)
          await castSession.loadMedia(request)
          setIsCasting(true)
        } else {
          const sessionRequest = new window.chrome.cast.SessionRequest(window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID)
          const apiConfig = new window.chrome.cast.ApiConfig(sessionRequest, 
            (session) => {
              setIsCasting(true)
              const mediaInfo = new window.chrome.cast.media.MediaInfo(url, 'application/x-mpegurl')
              const request = new window.chrome.cast.media.LoadRequest(mediaInfo)
              session.loadMedia(request)
            },
            () => {}
          )
          window.chrome.cast.initialize(apiConfig, () => {}, () => {})
        }
      } catch (e) {
        console.error('Cast error:', e)
      }
    } else {
      alert('Cast no disponible en este navegador')
    }
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const time = parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
  }

  const changeChannel = (direction: 'prev' | 'next') => {
    if (!channels.length || !onChannelChange) return
    let newIndex = currentIndex
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : channels.length - 1
    } else {
      newIndex = currentIndex < channels.length - 1 ? currentIndex + 1 : 0
    }
    onChannelChange(newIndex)
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onClick={() => setShowControls(!showControls)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        muted={isMuted}
        playsInline
        x-webkit-airplay="allow"
      />

      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors">
              <X className="w-6 h-6 text-white"/>
            </button>
            <h3 className="text-white text-lg font-bold truncate max-w-md">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {channels.length > 1 && (
              <>
                <button onClick={() => changeChannel('prev')} className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors">
                  <SkipBack className="w-5 h-5 text-white"/>
                </button>
                <button onClick={() => changeChannel('next')} className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors">
                  <SkipForward className="w-5 h-5 text-white"/>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!isPlaying && (
            <button onClick={togglePlay} className="p-6 bg-black/50 hover:bg-black/70 rounded-full transition-colors pointer-events-auto">
              <Play className="w-16 h-16 text-white fill-white"/>
            </button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={seek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E50914]"
              style={{
                background: `linear-gradient(to right, #E50914 0%, #E50914 ${(currentTime / (duration || 1)) * 100}%, #4B5563 ${(currentTime / (duration || 1)) * 100}%, #4B5563 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                {isPlaying ? <Pause className="w-6 h-6 text-white"/> : <Play className="w-6 h-6 text-white fill-white"/>}
              </button>
              <button onClick={() => skip(-10)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <SkipBack className="w-5 h-5 text-white"/>
              </button>
              <button onClick={() => skip(10)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <SkipForward className="w-5 h-5 text-white"/>
              </button>
              <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                {isMuted ? <VolumeX className="w-6 h-6 text-white"/> : <Volume2 className="w-6 h-6 text-white"/>}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleCast} className={`p-2 hover:bg-white/10 rounded-full transition-colors ${isCasting ? 'text-[#E50914]' : 'text-white'}`} title="Cast to device">
                <Cast className="w-6 h-6"/>
              </button>
              <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                {isFullscreen ? <Minimize className="w-6 h-6 text-white"/> : <Maximize className="w-6 h-6 text-white"/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
