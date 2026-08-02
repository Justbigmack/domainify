export const SIDEBAR_COLLAPSED_COOKIE = 'sidebar-collapsed'
export const SIDEBAR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
export const SIDEBAR_COLLAPSED_ATTRIBUTE = 'data-sidebar-collapsed'

export const SIDEBAR_COLLAPSED_SCRIPT = `(function(){try{var c=document.cookie.split('; ').indexOf('${SIDEBAR_COLLAPSED_COOKIE}=true')>-1;document.documentElement.setAttribute('${SIDEBAR_COLLAPSED_ATTRIBUTE}',String(c))}catch(e){}})()`
