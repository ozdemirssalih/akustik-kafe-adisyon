import Image from 'next/image'

interface LogoProps {
  height?: number
  className?: string
  priority?: boolean
}

export function Logo({ height = 64, className = '', priority = true }: LogoProps) {
  // Orijinal logo 8096x4416 → oran ~1.83
  const width = Math.round(height * 1.833)
  return (
    <Image
      src="/logo.png"
      alt="Akustik Kafe"
      width={width}
      height={height}
      priority={priority}
      className={`object-contain ${className}`}
    />
  )
}
