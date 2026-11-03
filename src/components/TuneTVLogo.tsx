export default function TuneTVLogo({ size = 40 }: { size?: number }) {
  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Fondo con gradiente */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #E50914 0%, #B00710 100%)',
          boxShadow: '0 4px 12px rgba(229, 9, 20, 0.4)'
        }}
      />
      
      {/* Letra T estilizada */}
      <svg 
        width={size * 0.6} 
        height={size * 0.6} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Barra horizontal de la T */}
        <rect x="15" y="20" width="70" height="15" rx="3" fill="white"/>
        {/* Barra vertical de la T */}
        <rect x="42.5" y="20" width="15" height="65" rx="3" fill="white"/>
        {/* Brillo sutil */}
        <rect x="15" y="20" width="70" height="7" rx="3" fill="rgba(255,255,255,0.3)"/>
      </svg>
    </div>
  )
}
