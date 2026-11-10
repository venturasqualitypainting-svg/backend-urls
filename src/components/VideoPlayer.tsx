// src/components/VideoPlayer.tsx
//
// NOTAS TÉCNICAS IMPORTANTES (requisitos reales del navegador):
// • Chromecast: requiere HTTPS + Google Chrome/Edge. El SDK se carga dinámicamente.
//   El "Default Media Receiver" de Google SÍ soporta HLS (.m3u8) de forma nativa.
// • AirPlay: requiere Safari (o iOS). AirPlay NO puede transmitir un stream servido
//   por MSE (hls.js). Por eso, en Safari se fuerza HLS NATIVO (video.src = url)
//   para que el botón de AirPlay funcione de verdad.
// • Roku: solo funciona en modelos con "Chromecast built-in" o vía AirPlay 2.
//   Un navegador web no puede enviar a Roku nativo sin una app receptora propia.
// • Como respaldo universal se implementa la Remote Playback API estándar
//   (video.remote.prompt()), que abre el selector de dispositivos del navegador.

import { useState, useEffect, useRef, useCallback } from 'react'
import Hls from 'hls.js'
import {
  X, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  ChevronLeft, ChevronRight, Cast, Airplay, Loader2,
  PictureInPicture2, AlertCircle, List, RotateCw
} from 'lucide-react'

interface ChannelItem {
  url: string
  title: string
}

interface VideoPlayerProps {
  url: string
  title: string
  onClose: () => void
  channels?: ChannelItem[]
  currentIndex?: number
  initialIndex?: number
  onChannelChange?: (index: number) => void
}

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void
    chrome?: any
    cast?: any
  }
}

const CAST_SDK_URL = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'

const isSafariBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /^((?!chrome|android|crios|fxios).)*safari/i.test(ua) || /iPad|iPhone|iPod/.test(ua)
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export default function VideoPlayer({
  url,
  title,
  onClose,
  channels = [],
  currentIndex = 0,
  initialIndex,
  onChannelChange
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const hideControlsTimer = useRef<number | null>(null)
  const castInitialized = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLive, setIsLive] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChannelList, setShowChannelList] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  // Casting states
  const [castAvailable, setCastAvailable] = useState(false)
  const [isCasting, setIsCasting] = useState(false)
  const [castDeviceName, setCastDeviceName] = useState('')
  const [airplayAvailable, setAirplayAvailable] = useState(false)
  const [castToast, setCastToast] = useState('')

  const activeIndex = currentIndex ?? initialIndex ?? 0
  const hasChannelList = channels.length > 0 && !!onChannelChange

  const showToast = useCallback((msg: string) => {
    setCastToast(msg)
    window.setTimeout(() => setCastToast(''), 4000)
  }, [])

  // ============================================================
  // 1. HLS ENGINE (nativo en Safari para habilitar AirPlay)
  // ============================================================
  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    setIsLoading(true)
    setErrorMsg('')
    setCurrentTime(0)
    setDuration(0)

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const useNativeHls = isSafariBrowser() || !Hls.isSupported()

    if (useNativeHls) {
      // Safari / iOS -> HLS nativo. IMPRESCINDIBLE para AirPlay.
      video.src = url
      const onMeta = () => {
        setIsLoading(false)
        setIsLive(!isFinite(video.duration) || video.duration === 0)
        setDuration(isFinite(video.duration) ? video.duration : 0)
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      }
      const onErr = () => {
        setIsLoading(false)
        setErrorMsg('No se pudo cargar el stream. Verifica la URL o intenta de nuevo.')
      }
      video.addEventListener('loadedmetadata', onMeta)
      video.addEventListener('error', onErr)
      video.load()

      return () => {
        video.removeEventListener('loadedmetadata', onMeta)
        video.removeEventListener('error', onErr)
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
    }

    // Chrome / Edge / Firefox -> hls.js (MSE)
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 60,
      maxBufferLength: 30,
      manifestLoadingTimeOut: 15000,
      manifestLoadingMaxRetry: 2
    })
    hlsRef.current = hls
    hls.loadSource(url)
    hls.attachMedia(video)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setIsLoading(false)
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    })

    hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
      const live = !!data.details?.live
      setIsLive(live)
      setDuration(live ? 0 : (data.details?.totalduration || 0))
    })

    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (!data.fatal) return
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          hls.startLoad()
          break
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls.recoverMediaError()
          break
        default:
          setIsLoading(false)
          setErrorMsg('Stream no disponible o bloqueado por el servidor (CORS).')
          hls.destroy()
          break
      }
    })

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [url, retryKey])

  // ============================================================
  // 2. VIDEO EVENT LISTENERS
  // ============================================================
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTime = () => setCurrentTime(video.currentTime)
    const onDur = () => {
      if (isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration)
        setIsLive(false)
      }
    }
    const onVol = () => {
      setIsMuted(video.muted)
      setVolume(video.volume)
    }
    const onWaiting = () => setIsLoading(true)
    const onPlaying = () => setIsLoading(false)
    const onEnded = () => {
      setIsPlaying(false)
      if (hasChannelList && activeIndex < channels.length - 1) {
        onChannelChange!(activeIndex + 1)
      }
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('durationchange', onDur)
    video.addEventListener('volumechange', onVol)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('durationchange', onDur)
      video.removeEventListener('volumechange', onVol)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('ended', onEnded)
    }
  }, [hasChannelList, activeIndex, channels.length, onChannelChange])

  // ============================================================
  // 3. CHROMECAST SDK
  // ============================================================
  useEffect(() => {
    if (castInitialized.current) return
    castInitialized.current = true

    const initCast = () => {
      try {
        const cast = window.cast
        const chrome = window.chrome
        if (!cast?.framework || !chrome?.cast?.media) return

        const castContext = cast.framework.CastContext.getInstance()
        castContext.setOptions({
          receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        })

        castContext.addEventListener(
          cast.framework.CastContextEventType.CAST_STATE_CHANGED,
          (event: any) => {
            const state = event.castState
            setCastAvailable(state !== 'NO_DEVICES_AVAILABLE')
            setIsCasting(state === 'CONNECTED')
          }
        )

        castContext.addEventListener(
          cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          (event: any) => {
            const session = event.session
            if (event.sessionState === cast.framework.SessionState.SESSION_STARTED) {
              const name = session?.getCastDevice?.()?.friendlyName || 'Smart TV'
              setCastDeviceName(name)
              setIsCasting(true)
              loadMediaToCast(session)
            }
            if (
              event.sessionState === cast.framework.SessionState.SESSION_ENDED ||
              event.sessionState === cast.framework.SessionState.SESSION_START_FAILED
            ) {
              setIsCasting(false)
              setCastDeviceName('')
              videoRef.current?.play().catch(() => {})
            }
          }
        )

        const initialState = castContext.getCastState()
        setCastAvailable(initialState !== 'NO_DEVICES_AVAILABLE')
      } catch (err) {
        console.error('Cast init error:', err)
      }
    }

    const loadMediaToCast = (session: any) => {
      try {
        const chrome = window.chrome
        if (!session || !chrome?.cast?.media) return
        const mediaInfo = new chrome.cast.media.MediaInfo(url, 'application/x-mpegURL')
        mediaInfo.streamType = isLive
          ? chrome.cast.media.StreamType.LIVE
          : chrome.cast.media.StreamType.BUFFERED
        const metadata = new chrome.cast.media.GenericMediaMetadata()
        metadata.title = title
        metadata.subtitle = 'TuneTV'
        mediaInfo.metadata = metadata
        const request = new chrome.cast.media.LoadRequest(mediaInfo)
        request.autoplay = true
        session.loadMedia(request).then(
          () => {
            videoRef.current?.pause()
            showToast('Transmitiendo a tu TV')
          },
          (err: any) => {
            console.error('loadMedia error:', err)
            showToast('La TV no pudo abrir este stream')
          }
        )
      } catch (err) {
        console.error('loadMediaToCast error:', err)
      }
    }

    window.__onGCastApiAvailable = (available: boolean) => {
      if (available) initCast()
    }

    if (!document.querySelector(`script[src="${CAST_SDK_URL}"]`)) {
      const script = document.createElement('script')
      script.src = CAST_SDK_URL
      script.async = true
      document.head.appendChild(script)
    } else if (window.cast?.framework) {
      initCast()
    }
  }, [url, title, isLive, showToast])

  // ============================================================
  // 4. AIRPLAY + REMOTE PLAYBACK API (respaldo universal)
  // ============================================================
  useEffect(() => {
    const video = videoRef.current as any
    if (!video) return

    const onAirplayAvailability = (event: any) => {
      setAirplayAvailable(event.availability === 'available')
    }
    video.addEventListener('webkitplaybacktargetavailabilitychanged', onAirplayAvailability)

    const onAirplayActive = (event: any) => {
      setIsCasting(!!event.active)
      if (event.active) setCastDeviceName('AirPlay')
      else setCastDeviceName('')
    }
    video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', onAirplayActive)

    // Remote Playback API (Chrome/Safari) -> abre selector nativo de dispositivos
    let remoteWatcher: number | null = null
    if (video.remote && typeof video.remote.watchAvailability === 'function') {
      video.remote
        .watchAvailability((available: boolean) => {
          if (available) setCastAvailable(true)
        })
        .then((id: number) => { remoteWatcher = id })
        .catch(() => { /* no soportado */ })
    }

    return () => {
      video.removeEventListener('webkitplaybacktargetavailabilitychanged', onAirplayAvailability)
      video.removeEventListener('webkitcurrentplaybacktargetiswirelesschanged', onAirplayActive)
      if (video.remote && remoteWatcher !== null && typeof video.remote.cancelWatchAvailability === 'function') {
        video.remote.cancelWatchAvailability(remoteWatcher).catch(() => {})
      }
    }
  }, [])

  // ============================================================
  // 5. CONTROLS LOGIC
  // ============================================================
  const revealControls = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current)
    hideControlsTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false)
    }, 3500)
  }, [])

  useEffect(() => {
    revealControls()
    return () => {
      if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current)
    }
  }, [revealControls])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => {})
    else video.pause()
    revealControls()
  }, [revealControls])

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleVolume = (value: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = value
    video.muted = value === 0
    setVolume(value)
    setIsMuted(value === 0)
  }

  const handleSeek = (value: number) => {
    const video = videoRef.current
    if (!video || isLive) return
    video.currentTime = value
    setCurrentTime(value)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const togglePiP = async () => {
    const video = videoRef.current as any
    if (!video) return
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else if (video.requestPictureInPicture) await video.requestPictureInPicture()
    } catch (err) {
      console.error('PiP error:', err)
    }
  }

  const handleCastClick = async () => {
    const cast = window.cast
    const video = videoRef.current as any

    // 1) Chromecast SDK
    if (cast?.framework) {
      try {
        const castContext = cast.framework.CastContext.getInstance()
        if (isCasting) {
          castContext.endCurrentSession(true)
          setIsCasting(false)
          setCastDeviceName('')
          showToast('Transmisión finalizada')
          return
        }
        await castContext.requestSession()
        return
      } catch (err: any) {
        if (err?.code !== 'cancel') console.error('requestSession error:', err)
      }
    }

    // 2) Remote Playback API (selector nativo del navegador)
    if (video?.remote && typeof video.remote.prompt === 'function') {
      try {
        await video.remote.prompt()
        return
      } catch (err) {
        console.error('remote.prompt error:', err)
      }
    }

    showToast('No se detectaron dispositivos. Usa Chrome + HTTPS y la misma red Wi-Fi.')
  }

  const handleAirplayClick = () => {
    const video = videoRef.current as any
    if (video?.webkitShowPlaybackTargetPicker) {
      video.webkitShowPlaybackTargetPicker()
    } else {
      showToast('AirPlay requiere Safari o un dispositivo iOS.')
    }
  }

  const goToChannel = (dir: -1 | 1) => {
    if (!hasChannelList) return
    const next = activeIndex + dir
    if (next >= 0 && next < channels.length) onChannelChange!(next)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'm':
          toggleMute()
          break
        case 'f':
          toggleFullscreen()
          break
        case 'escape':
          if (!document.fullscreenElement) onClose()
          break
        case 'arrowright':
          if (!isLive && videoRef.current) videoRef.current.currentTime += 10
          break
        case 'arrowleft':
          if (!isLive && videoRef.current) videoRef.current.currentTime -= 10
          break
      }
      revealControls()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, isLive, onClose, revealControls])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000] bg-black flex flex-col"
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      {/* VIDEO ELEMENT */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          playsInline
          autoPlay
          {...{ 'x-webkit-airplay': 'allow', 'webkit-playsinline': 'true' }}
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
        />

        {/* LOADING */}
        {isLoading && !errorMsg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 pointer-events-none">
            <Loader2 className="w-12 h-12 text-[#E50914] animate-spin mb-3" />
            <p className="text-white text-sm">Cargando transmisión...</p>
          </div>
        )}

        {/* ERROR */}
        {errorMsg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
            <AlertCircle className="w-14 h-14 text-[#E50914] mb-4" />
            <p className="text-white font-bold text-lg mb-2">No se pudo reproducir</p>
            <p className="text-[#B3B3B3] text-sm max-w-md mb-6">{errorMsg}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setRetryKey(k => k + 1)}
                className="px-5 py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-medium flex items-center gap-2 transition-colors"
              >
                <RotateCw className="w-4 h-4" /> Reintentar
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] text-white rounded-md font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* CASTING OVERLAY */}
        {isCasting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <Cast className="w-16 h-16 text-[#E50914] mb-4 animate-pulse" />
            <p className="text-white text-xl font-bold mb-1">Transmitiendo</p>
            <p className="text-[#B3B3B3] text-sm mb-1">{title}</p>
            <p className="text-[#808080] text-xs mb-6">en {castDeviceName || 'dispositivo externo'}</p>
            <button
              onClick={handleCastClick}
              className="px-5 py-2.5 bg-[#E50914] hover:bg-[#F40612] text-white rounded-md font-medium transition-colors"
            >
              Detener transmisión
            </button>
          </div>
        )}

        {/* TOAST */}
        {castToast && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#181818] border border-[#2F2F2F] text-white text-sm px-4 py-2.5 rounded-md shadow-2xl z-30">
            {castToast}
          </div>
        )}

        {/* TOP BAR */}
        <div
          className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-white text-lg md:text-xl font-bold truncate">{title}</h2>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-[#E50914] rounded text-[10px] font-bold text-white">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  EN VIVO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* AIRPLAY */}
              {airplayAvailable && (
                <button
                  onClick={handleAirplayClick}
                  className="p-2.5 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                  title="AirPlay"
                >
                  <Airplay className="w-5 h-5" />
                </button>
              )}
              {/* CHROMECAST */}
              <button
                onClick={handleCastClick}
                className={`p-2.5 rounded-full transition-colors ${
                  isCasting
                    ? 'bg-[#E50914] text-white'
                    : castAvailable
                      ? 'bg-black/50 hover:bg-black/80 text-white'
                      : 'bg-black/30 text-white/40'
                }`}
                title={castAvailable ? 'Transmitir a TV (Chromecast)' : 'Buscar dispositivos'}
              >
                <Cast className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2.5 bg-black/50 hover:bg-[#E50914] rounded-full text-white transition-colors"
                title="Cerrar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* CHANNEL LIST PANEL */}
        {hasChannelList && showChannelList && (
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-[#141414]/98 backdrop-blur-sm border-l border-[#2F2F2F] overflow-y-auto z-20">
            <div className="sticky top-0 bg-[#141414] border-b border-[#2F2F2F] p-4 flex items-center justify-between">
              <h3 className="text-white font-bold">Canales ({channels.length})</h3>
              <button onClick={() => setShowChannelList(false)} className="text-[#808080] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              {channels.map((ch, idx) => (
                <button
                  key={`${ch.url}-${idx}`}
                  onClick={() => { onChannelChange!(idx); setShowChannelList(false) }}
                  className={`w-full text-left px-3 py-3 rounded-md mb-1 transition-colors flex items-center gap-3 ${
                    idx === activeIndex
                      ? 'bg-[#E50914] text-white'
                      : 'text-[#e5e5e5] hover:bg-[#2F2F2F]'
                  }`}
                >
                  <span className="text-xs font-mono opacity-60 w-6 flex-shrink-0">{idx + 1}</span>
                  <span className="text-sm font-medium truncate">{ch.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM CONTROLS */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* SEEK BAR */}
          {!isLive && duration > 0 && (
            <div className="mb-3">
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#E50914]"
                style={{
                  background: `linear-gradient(to right, #E50914 ${progressPercent}%, #4F4F4F ${progressPercent}%)`
                }}
              />
              <div className="flex justify-between text-[11px] text-[#B3B3B3] mt-1 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-3">
            {/* Prev channel */}
            {hasChannelList && (
              <button
                onClick={() => goToChannel(-1)}
                disabled={activeIndex <= 0}
                className="p-2 text-white hover:text-[#E50914] disabled:opacity-30 transition-colors"
                title="Canal anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              title="Reproducir/Pausar (Espacio)"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Next channel */}
            {hasChannelList && (
              <button
                onClick={() => goToChannel(1)}
                disabled={activeIndex >= channels.length - 1}
                className="p-2 text-white hover:text-[#E50914] disabled:opacity-30 transition-colors"
                title="Canal siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="p-2 text-white hover:text-[#E50914] transition-colors" title="Silenciar (M)">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolume(parseFloat(e.target.value))}
                className="w-0 group-hover/vol:w-20 md:w-20 h-1 rounded-full appearance-none cursor-pointer accent-white bg-[#4F4F4F] transition-all duration-300"
              />
            </div>

            {/* Live indicator */}
            {isLive && (
              <div className="flex items-center gap-1.5 ml-1">
                <span className="w-2 h-2 bg-[#E50914] rounded-full animate-pulse" />
                <span className="text-white text-xs font-bold">EN VIVO</span>
              </div>
            )}

            <div className="flex-1" />

            {/* Channel list toggle */}
            {hasChannelList && (
              <button
                onClick={() => setShowChannelList(!showChannelList)}
                className={`p-2 rounded-md transition-colors ${
                  showChannelList ? 'bg-[#E50914] text-white' : 'text-white hover:text-[#E50914]'
                }`}
                title="Lista de canales"
              >
                <List className="w-5 h-5" />
              </button>
            )}

            {/* PiP */}
            <button
              onClick={togglePiP}
              className="hidden md:block p-2 text-white hover:text-[#E50914] transition-colors"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:text-[#E50914] transition-colors"
              title="Pantalla completa (F)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}