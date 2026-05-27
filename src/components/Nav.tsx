'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Nav({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/board', label: 'Board' },
  ]

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-indigo-600 text-lg">tskmngr</span>
        <div className="flex gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                pathname === l.href ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 hidden sm:block">{userEmail}</span>
        <button onClick={handleSignOut} className="text-xs text-slate-500 hover:text-slate-700">
          Sign out
        </button>
      </div>
    </nav>
  )
}
