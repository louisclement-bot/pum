export function FourSidedRoofIcon({ className = "", size = 48 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="matrix(1,0,0,1,-0.0001,0)">
        <g transform="matrix(1,0,0,1,0.0001,0)">
          <path d="M512,0L1024,512L512,1024L0,512L512,0Z" fill="currentColor" />
        </g>
      </g>
    </svg>
  )
}
