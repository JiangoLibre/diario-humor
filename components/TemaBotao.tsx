'use client'

import { useEffect, useState } from 'react'

export default function TemaBotao() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function alternar() {
    const novo = !dark
    document.documentElement.classList.toggle('dark', novo)
    try { localStorage.setItem('tema', novo ? 'dark' : 'light') } catch {}
    setDark(novo)
  }

  return (
    <button
      onClick={alternar}
      aria-label="Alternar tema"
      className="fixed bottom-4 right-4 z-50 h-11 w-11 rounded-full text-lg shadow-md md:bottom-auto md:top-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}