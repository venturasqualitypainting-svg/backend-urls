import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Share2, X, Copy, Check, Download } from 'lucide-react'

interface ShareAppModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ShareAppModal({ isOpen, onClose }: ShareAppModalProps) {
  const [copied, setCopied] = useState(false)
  const appUrl = window.location.href

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TuneTV - Tu Plataforma de Entretenimiento',
          text: '¡Mira TuneTV! La mejor plataforma de entretenimiento.',
          url: appUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      handleCopy()
    }
  }

  const handleDownloadQR = () => {
    const svg = document.querySelector('#qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    canvas.width = 512
    canvas.height = 512

    img.onload = () => {
      if (!ctx) return
      ctx.fillStyle = '#141414'
      ctx.fillRect(0, 0, 512, 512)
      ctx.drawImage(img, 0, 0, 512, 512)
      
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = 'tunetv-qr.png'
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1F1F1F] border border-[#2F2F2F] rounded-lg p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E50914]/20 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-[#E50914]"/>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Compartir TuneTV</h3>
                <p className="text-[#808080] text-xs">Comparte con amigos y familia</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-[#808080] hover:text-white transition-colors">
              <X className="w-5 h-5"/>
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 mb-4 flex items-center justify-center">
            <QRCodeSVG id="qr-code-svg" value={appUrl} size={256} bgColor="#ffffff" fgColor="#E50914" level="H"/>
          </div>

          <div className="bg-[#141414] border border-[#2F2F2F] rounded-md p-3 mb-4">
            <p className="text-[#808080] text-xs mb-1">URL de la aplicación:</p>
            <p className="text-white text-sm break-all font-mono">{appUrl}</p>
          </div>

          <div className="space-y-2">
            <button onClick={handleCopy} className="w-full py-3 bg-[#2F2F2F] text-white rounded-md hover:bg-[#3F3F3F] transition-colors flex items-center justify-center gap-2 font-medium">
              {copied ? <><Check className="w-5 h-5 text-green-400"/>¡Copiado!</> : <><Copy className="w-5 h-5"/>Copiar URL</>}
            </button>
            <button onClick={handleShare} className="w-full py-3 bg-[#E50914] text-white rounded-md hover:bg-[#F40612] transition-colors flex items-center justify-center gap-2 font-medium">
              <Share2 className="w-5 h-5"/>Compartir Aplicación
            </button>
            <button onClick={handleDownloadQR} className="w-full py-3 bg-[#2F2F2F] text-white rounded-md hover:bg-[#3F3F3F] transition-colors flex items-center justify-center gap-2 font-medium">
              <Download className="w-5 h-5"/>Descargar QR
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
