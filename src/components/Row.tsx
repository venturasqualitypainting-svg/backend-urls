// src/components/Row.tsx
import { useRef, useState, useEffect, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface RowProps {
  title: string
  children: ReactNode
}

export default function Row({ title, children }: RowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollPosition = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5)
  }

  useEffect(() => {
    checkScrollPosition()
    const el = scrollRef.current
    if (!el) return

    el.addEventListener('scroll', checkScrollPosition, { passive: true })
    window.addEventListener('resize', checkScrollPosition)

    // Re-check when children/content change size (images loading, new items, etc.)
    const resizeObserver = new ResizeObserver(() => checkScrollPosition())
    resizeObserver.observe(el)

    const timeout = setTimeout(checkScrollPosition, 300)

    return () => {
      el.removeEventListener('scroll', checkScrollPosition)
      window.removeEventListener('resize', checkScrollPosition)
      resizeObserver.disconnect()
      clearTimeout(timeout)
    }
  }, [children])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(el.clientWidth * 0.8, 300)
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    })
  }

  return (
    <div
      className="relative group/row mb-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Row Title */}
      <h3 className="text-white text-lg md:text-xl font-bold mb-3 px-4 md:px-12 flex items-center gap-2">
        {title}
        <span className="text-[#808080] text-xs font-normal opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
          Explorar todo
          <ChevronRight className="w-3 h-3 inline-block ml-0.5" />
        </span>
      </h3>

      {/* Scroll Container Wrapper */}
      <div className="relative">
        {/* LEFT ARROW */}
        <button
          type="button"
          aria-label="Desplazar a la izquierda"
          onClick={() => scroll('left')}
          className={`absolute left-0 top-0 bottom-0 z-40 w-10 md:w-12 flex items-center justify-center
            bg-gradient-to-r from-black/90 via-black/70 to-transparent
            transition-all duration-300 ease-out
            ${isHovered && canScrollLeft ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
            hover:from-black hover:via-black/85`}
        >
          <ChevronLeft className="w-7 h-7 md:w-9 md:h-9 text-white drop-shadow-lg transition-transform duration-200 hover:scale-125" />
        </button>

        {/* SCROLLABLE CONTENT */}
        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scroll-smooth px-4 md:px-12 pb-4
            scrollbar-hide
            [&::-webkit-scrollbar]:hidden
            [-ms-overflow-style:none]
            [scrollbar-width:none]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>

        {/* RIGHT ARROW */}
        <button
          type="button"
          aria-label="Desplazar a la derecha"
          onClick={() => scroll('right')}
          className={`absolute right-0 top-0 bottom-0 z-40 w-10 md:w-12 flex items-center justify-center
            bg-gradient-to-l from-black/90 via-black/70 to-transparent
            transition-all duration-300 ease-out
            ${isHovered && canScrollRight ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
            hover:from-black hover:via-black/85`}
        >
          <ChevronRight className="w-7 h-7 md:w-9 md:h-9 text-white drop-shadow-lg transition-transform duration-200 hover:scale-125" />
        </button>

        {/* Edge fade hints (always subtle, stronger on hover) */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-[#141414] to-transparent transition-opacity duration-300 ${
            canScrollRight && !isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  )
}