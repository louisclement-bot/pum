import Image from "next/image"
type PumLogoProps = {
  className?: string
  width?: number
  height?: number
}

export function PumLogo({ className = "", width = 96, height = 48 }: PumLogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image src="/images/pum-logo.svg" alt="PUM Logo" fill priority className="object-contain" />
    </div>
  )
}
