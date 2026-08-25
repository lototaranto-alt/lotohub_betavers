import Link from 'next/link'
import { MapPin, Map, Calendar, MessageSquare, Users, Settings } from 'lucide-react'

const navItems = [
  { name: 'Mete (POI)', href: '/pois', icon: MapPin },
  { name: 'Check-in', href: '/checkins', icon: Map },
  { name: 'Eventi', href: '/events', icon: Calendar },
  { name: 'Feedbacks', href: '/feedbacks', icon: MessageSquare },
  { name: 'Profili', href: '/profiles', icon: Users },
]

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">L.O.T.O. Admin</h1>
      </div>
      <nav className="flex-1 space-y-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <Link
          href="/settings"
          className="flex items-center space-x-3 px-2 py-2 text-gray-400 hover:text-white"
        >
          <Settings className="h-5 w-5" />
          <span>Impostazioni</span>
        </Link>
      </div>
    </div>
  )
}
