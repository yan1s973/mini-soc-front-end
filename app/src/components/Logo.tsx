type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M14 1 25.26 7.5v13L14 27 2.74 20.5v-13L14 1Zm0 7-6 6 6 6 6-6-6-6Zm0 3.5L16.5 14 14 16.5 11.5 14 14 11.5Z"
      />
    </svg>
  )
}
