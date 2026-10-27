'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const niveis = [
  { min: 0, emoji: '🌱', nome: 'Semente' },
  { min: 30, emoji: '🌿', nome: 'Broto' },
  { min: 100, emoji: '🍀', nome: 'Plantinha' },
  { min: 250, emoji: '🌳', nome: 'Árvore' },
  { min: 500, emoji: '🌸', nome: 'Florida' },
]
const letras = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function iso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

export default function Progresso() {
  const [semana, setSemana] = useState<{ l: string; ok: boolean }[]>([])
  const [pontos, setPontos] = useState(0)

  const carregar = useCallback(async () => {
    const dias: Date[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dias.push(d)
    }
    const [{ data: sem }, { count: nReg }, { count: nQ }] = await Promise.all([
      supabase.from('registros').select('data').gte('data', iso(dias[0])),
      supabase.from('registros').select('id', { count: 'exact', head: true }),
      supabase.from('questionarios').select('id', { count: 'exact', head: true }),
    ])
    const feitos = new Set((sem ?? []).map(r => r.data))
    setSemana(dias.map(d => ({ l: letras[d.getDay()], ok: feitos.has(iso(d)) })))
    setPontos((nReg ?? 0) * 10 + (nQ ?? 0) * 30)
  }, [])

  useEffect(() => {
    carregar()
    window.addEventListener('progresso-atualizar', carregar)
    return () => window.removeEventListener('progresso-atualizar', carregar)
  }, [carregar])

  let idx = 0
  niveis.forEach((n, i) => { if (pontos >= n.min) idx = i })
  const atual = niveis[idx]
  const prox = niveis[idx + 1]
  const pct = prox ? Math.round(((pontos - atual.min) / (prox.min - atual.min)) * 100) : 100
  const feitos = semana.filter(s => s.ok).length

  const msg =
    feitos === 0 ? 'Quando quiser, é só registrar seu dia. Sem pressa.'
    : feitos === 7 ? 'Semana completa! Que constância 🌸'
    : `Você registrou ${feitos} de 7 dias nesta semana. Cada dia conta.`

  return (
    <section className="card space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{atual.emoji}</span>
        <div className="flex-1">
          <p className="font-semibold">{atual.nome}</p>
          <p className="text-xs text-muted">
            {pontos} pontos{prox ? ` · próximo: ${prox.nome} (${prox.min})` : ''}
          </p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex justify-between">
        {semana.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={`h-7 w-7 rounded-full text-center text-sm leading-7 ${s.ok ? 'bg-brand text-white' : 'text-muted'}`}
              style={s.ok ? undefined : { border: '1px solid var(--line)' }}
            >
              {s.ok ? '✓' : ''}
            </span>
            <span className="text-xs text-muted">{s.l}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted">{msg}</p>
    </section>
  )
}