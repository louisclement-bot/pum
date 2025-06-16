interface WashingMachineIconProps {
  className?: string
}

export function WashingMachineIcon({ className = "" }: WashingMachineIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <rect x="6" y="4" width="12" height="2" rx="1" />
      <circle cx="17" cy="5" r="1" />
    </svg>
  )
}
