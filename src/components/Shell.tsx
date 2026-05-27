'use client'

import Nav from './Nav'

export default function Shell({ userEmail, children }: { userEmail?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav userEmail={userEmail} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  )
}
