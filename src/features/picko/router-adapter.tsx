import { Outlet, useRouter, useRouterState, useParams as useRouteParams } from '@tanstack/react-router'
import type { AnchorHTMLAttributes, MouseEvent } from 'react'

export { Outlet }

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> & {
  to: string
  end?: boolean
  className?: string | ((state: { isActive: boolean }) => string)
}

// Keep the imported presentation API while navigation is owned by TanStack.
export function Link({ to, end, className, onClick, ...props }: LinkProps) {
  const router = useRouter()
  const pathname = useRouterState({ select: state => state.location.pathname })
  const target = to.split('?')[0]
  const isActive = end ? pathname === target : pathname === target || pathname.startsWith(`${target}/`)
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank') return
    event.preventDefault()
    router.history.push(to)
  }
  return <a {...props} href={to} className={typeof className === 'function' ? className({ isActive }) : className} onClick={follow} />
}

export const NavLink = Link

export function useLocation() {
  return useRouterState({ select: state => state.location })
}

export function useParams() {
  return useRouteParams({ strict: false })
}

export function useSearchParams(): [URLSearchParams, (params: URLSearchParams, options?: { replace?: boolean }) => void] {
  const router = useRouter()
  const location = useLocation()
  return [new URLSearchParams(location.searchStr), (params, options) => {
    const query = params.toString()
    const href = `${location.pathname}${query ? `?${query}` : ''}`
    if (options?.replace) router.history.replace(href)
    else router.history.push(href)
  }]
}