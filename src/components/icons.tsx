import type { ComponentPropsWithoutRef } from 'react'

type IconProps = ComponentPropsWithoutRef<'svg'>

const iconDefaults = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export const GlobeIcon = (props: IconProps) => (
  <svg {...iconDefaults} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

export const PlusIcon = (props: IconProps) => (
  <svg {...iconDefaults} {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
)

export const SearchIcon = (props: IconProps) => (
  <svg {...iconDefaults} {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...iconDefaults} {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const SunIcon = (props: IconProps) => (
  <svg {...iconDefaults} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
)

export const MoonIcon = (props: IconProps) => (
  <svg {...iconDefaults} {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
  </svg>
)

export const MailIcon = (props: IconProps) => (
  <svg {...iconDefaults} {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

export const SignOutIcon = (props: IconProps) => (
  <svg {...iconDefaults} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
)

export const ExternalLinkIcon = (props: IconProps) => (
  <svg {...iconDefaults} {...props}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
)
