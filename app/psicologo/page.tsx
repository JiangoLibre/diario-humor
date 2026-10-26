'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Vinculo = { id: string; codigo: string; status: string; paciente_id: string | null; paciente: { nome: string } | null }
type Reg = { paciente_id: string; data: string; humor: number }

function diasDesde(data: string) {
  const h = new Date()
  h.setHours(0, 0, 0, 0)
  return Math.round((h.getTime() - new Date(data + 'T00:00:00').getTime()) / 86400000)
}

function resumo(regs: Reg[]) {
  const ord = [...regs].sort((a, b) => a.data.localeCompare(b.data))
  const ultimo = ord.length ? ord[ord.length - 1].data : undefined
  const sem7 = ord.filter(r => diasDesde(r.data) <= 6)
  const ant7 = ord.filter(r => diasDesde(r.data) > 6)
  const med = (l: Reg[]) => (l.length ? l.reduce((s, r) => s + r.humor, 0) / l.length : null)
  const m7 = med(sem7)
  const mAnt = med(ant7)

  let tendencia = '→'
  if (m7 !== null && mAnt !== null) {
    if (m7 - mAnt >= 0.5) tendencia = '↗'
    else if (mAnt - m7 >= 0.5) tendencia = '↘'
  }

  const ult3 = ord.slice(-3)
  const baixo = ult3.length === 3 && ult3.every(r => r.humor <= 2)
  const semRegistro = !ultimo || diasDesde(ultimo) >= 3

  return { ultimo, m7, tendencia, baixo, semRegistro }
}

export default function Psicologo() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [regs, setRegs] = useState<Reg[]>([])

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('vinculos')
      .select('id, codigo, status, paciente_id, paciente:perfis!paciente_id(nome)')
    setVinculos((data ?? []) as unknown as Vinculo[])

    const desde = new Date()
    desde.setDate(desde.getDate() - 14)
    const { data: r } = await supabase
      .from('registros')
      .select('paciente_id, data, humor')
      .gte('data', desde.toISOString().slice(0, 10))
    setRegs(r ?? [])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push('/login')
      const { data: p } = await supabase.from('perfis').select('nome').eq('id', data.user.id).single()
      setNome(p?.nome ?? '')
      carregar()
    })
  }, [router, carregar])

  async function convidar() {
    const { data } = await supabase.auth.getUser()
    const codigo = Math.random().toString(36).slice(2, 8).toUpperCase()
    await supabase.from('vinculos').insert({ psicologo_id: data.user!.id, codigo })
    carregar()
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Olá, {nome} 👋</h1>
        <button onClick={sair} className="link">Sair</button>
      </header>

      <button onClick={convidar} className="btn">+ Gerar convite</button>

      <div className="space-y-2">
        <h2 className="font-semibold">Pacientes</h2>
        {vinculos.length === 0 && <p className="text-sm text-muted">Nenhum convite ainda.</p>}

        {vinculos.map(v => {
          if (v.status === 'pendente') {
            return (
              <div key={v.id} className="card text-sm">
                Código: <b className="tracking-widest">{v.codigo}</b> <span className="text-muted">(aguardando)</span>
              </div>
            )
          }
          if (v.status !== 'ativo') {
            return (
              <div key={v.id} className="card text-sm text-muted">
                {v.paciente?.nome ?? 'Paciente'} ({v.status})
              </div>
            )
          }

          const r = resumo(regs.filter(x => x.paciente_id === v.paciente_id))
          return (
            <a key={v.id} href={`/psicologo/paciente/${v.paciente_id}`} className="card block space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-brand-dark">{v.paciente?.nome ?? 'Paciente'}</span>
                <span className="text-lg">{r.tendencia}</span>
              </div>
              <p className="text-xs text-muted">
                Último registro: {r.ultimo ? `${r.ultimo.slice(8)}/${r.ultimo.slice(5, 7)}` : 'nenhum'}
                {' · '}Média 7 dias: {r.m7 !== null ? r.m7.toFixed(1) : '-'}
              </p>
              <div className="flex flex-wrap gap-2">
                {r.baixo && (
                  <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">Humor baixo nos últimos 3 registros</span>
                )}
                {r.semRegistro && (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                    {r.ultimo ? `Sem registro há ${diasDesde(r.ultimo)} dias` : 'Sem registros'}
                  </span>
                )}
              </div>
            </a>
          )
        })}
      </div>

      <p className="text-xs text-muted">
        Indicadores de apoio, não monitoramento em tempo real. Registros marcados como privados não aparecem aqui.
      </p>
    </main>
  )
}