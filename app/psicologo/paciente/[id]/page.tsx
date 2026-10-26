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
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <a href="/psicologo" className="underline text-sm">← Voltar</a>
      <h1 className="text-xl font-bold">{nome}</h1>

      <div className="flex gap-2 text-sm">
        {[7, 30].map(d => (
          <button key={d} onClick={() => setDias(d)}
            className={`px-3 py-1 rounded border ${dias === d ? 'bg-black text-white' : ''}`}>
            {d} dias
          </button>
        ))}
      </div>

      <p className="text-sm">Registros: {regs.length} | Humor médio: {media}</p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={regs}>
            <XAxis dataKey="data" tickFormatter={(d: string) => d.slice(5)} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip />
            <Line type="monotone" dataKey="humor" stroke="#000" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="space-y-2">
        {[...regs].reverse().map(r => (
          <li key={r.id} className="border rounded p-2 text-sm">
            <b>{r.data.slice(8)}/{r.data.slice(5, 7)}</b> {rostos[r.humor - 1]}
            {r.texto && <p className="mt-1">{r.texto}</p>}
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