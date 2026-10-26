'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'


type Reg = { id: string; data: string; humor: number; texto: string | null }
const rostos = ['😢', '🙁', '😐', '🙂', '😄']

function Conteudo() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [regs, setRegs] = useState<Reg[]>([])
  const [dias, setDias] = useState(7)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push('/login')
      const { data: p } = await supabase.from('perfis').select('nome').eq('id', id).single()
      setNome(p?.nome ?? '')
      const desde = new Date()
      desde.setDate(desde.getDate() - dias)
      const { data: r } = await supabase
        .from('registros').select('id, data, humor, texto')
        .eq('paciente_id', id)
        .gte('data', desde.toISOString().slice(0, 10))
        .order('data')
      setRegs(r ?? [])
    })
  }, [id, dias, router])

  const media = regs.length
    ? (regs.reduce((s, r) => s + r.humor, 0) / regs.length).toFixed(1)
    : '-'

    return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <a href="/psicologo" className="link">← Voltar</a>
      <h1 className="text-xl font-bold">{nome}</h1>

      <div className="flex gap-2">
        {[7, 30].map(d => (
          <button key={d} onClick={() => setDias(d)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${dias === d ? 'bg-brand text-white' : 'bg-white text-muted border border-gray-200'}`}>
            {d} dias
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card"><p className="text-xs text-muted">Registros</p><p className="text-2xl font-bold">{regs.length}</p></div>
        <div className="card"><p className="text-xs text-muted">Humor médio</p><p className="text-2xl font-bold">{media}</p></div>
      </div>

      <div className="card h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={regs}>
            <XAxis dataKey="data" tickFormatter={(d: string) => d.slice(5)} stroke="#9CA3AF" fontSize={12} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#9CA3AF" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="humor" stroke="#2BB5A3" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="space-y-2">
        {[...regs].reverse().map(r => (
          <li key={r.id} className="card text-sm">
            <b>{r.data.slice(8)}/{r.data.slice(5, 7)}</b> <span className="text-lg">{rostos[r.humor - 1]}</span>
            {r.texto && <p className="mt-1 text-muted">{r.texto}</p>}
          </li>
        ))}
      </ul>
    </main>
  )
}
export default function PacientePsi() {
  return (
    <Suspense fallback={<p className="p-6">Carregando...</p>}>
      <Conteudo />
    </Suspense>
  )
}