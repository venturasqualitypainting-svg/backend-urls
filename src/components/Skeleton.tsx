export default function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[16vw] min-w-[200px]">
      <div className="aspect-video bg-[#333] rounded-md animate-pulse"/>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="mb-12">
      <div className="h-7 w-48 bg-[#333] rounded mb-2 mx-4 md:mx-12 animate-pulse"/>
      <div className="flex gap-2 overflow-hidden px-4 md:px-12">
        {[...Array(8)].map((_, i) => <SkeletonCard key={i}/>)}
      </div>
    </div>
  )
}
