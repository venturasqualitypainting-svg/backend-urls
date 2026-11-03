export default function TuneTVLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF1744" />
          <stop offset="50%" stopColor="#E50914" />
          <stop offset="100%" stopColor="#B00710" />
        </linearGradient>
        <linearGradient id="shineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="tvBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2A2A2A" />
          <stop offset="100%" stopColor="#0A0A0A" />
        </linearGradient>
      </defs>
      
      <rect x="60" y="100" width="392" height="280" rx="30" fill="url(#tvBody)" stroke="#333" strokeWidth="3"/>
      <rect x="85" y="125" width="342" height="230" rx="15" fill="#0A0A0A"/>
      <rect x="85" y="125" width="342" height="230" rx="15" fill="url(#shineGrad)" opacity="0.1"/>
      
      <g filter="url(#glow)">
        <path d="M 195 165 L 195 325 L 225 325 L 225 165 Z" fill="url(#redGrad)"/>
        <path d="M 287 165 L 287 325 L 317 325 L 317 165 Z" fill="url(#redGrad)"/>
        <path d="M 195 165 L 317 165 L 317 195 L 287 195 L 225 295 L 225 325 L 195 325 L 195 295 L 257 195 L 225 195 Z" fill="url(#redGrad)"/>
      </g>
      
      <path d="M 195 165 L 225 165 L 225 200 L 195 200 Z" fill="rgba(255,255,255,0.2)"/>
      
      <rect x="200" y="380" width="112" height="15" rx="7" fill="#1A1A1A" stroke="#333" strokeWidth="2"/>
      <rect x="230" y="395" width="52" height="8" rx="4" fill="#1A1A1A"/>
      
      <circle cx="256" cy="365" r="4" fill="#E50914" opacity="0.8"/>
      <circle cx="256" cy="365" r="6" fill="#E50914" opacity="0.2"/>
    </svg>
  )
}
