'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, LayoutDashboard } from 'lucide-react'
import { LogoutButton } from './LogoutButton'

export function Sidebar() {
  const pathname = usePathname()
  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Report DaaS', href: '/daas', icon: BarChart3 },
  ]

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-widest text-emerald-500">L.O.T.O.</h1>
      </div>
      <nav className="flex-1 space-y-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-6 py-3 transition ${
                isActive
                  ? 'border-r-2 border-emerald-400 bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : ''}`} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="space-y-3 border-t border-slate-800 p-4 text-xs text-slate-500 text-center">
        <p>Versione Read-Only (v2)</p>
        <LogoutButton />
      </div>
    </div>
  )
}
