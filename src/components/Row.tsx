import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface RowProps {
  title: string
  children: React.ReactNode
}

export default function Row({ title, children }: RowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.8
      rowRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="mb-12 group/row">
      <h2 className="text-[#e5e5e5] text-[1.4vw] font-bold mb-2 px-4 md:px-12">{title}</h2>
      <div className="relative px-4 md:px-12">
        {showLeftArrow && (
          <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-0 w-12 bg-black/50 hover:bg-black/80 z-20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
            <ChevronLeft className="w-8 h-8 text-white"/>
          </button>
        )}
        <div ref={rowRef} onScroll={handleScroll} className="flex gap-2 overflow-x-auto scrollbar-hide">
          {children}
        </div>
        {showRightArrow && (
          <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-0 w-12 bg-black/50 hover:bg-black/80 z-20 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
            <ChevronRight className="w-8 h-8 text-white"/>
          </button>
        )}
      </div>
    </div>
  )
}
