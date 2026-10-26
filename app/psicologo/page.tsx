'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Vinculo = { id: string; codigo: string; status: string; paciente_id: string | null; paciente: { nome: string } | null }
export default function Psicologo() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [vinculos, setVinculos] = useState<Vinculo[]>([])

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('vinculos')
      .select('id, codigo, status, paciente_id, paciente:perfis!paciente_id(nome)')
    setVinculos((data ?? []) as unknown as Vinculo[])
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
        {vinculos.map(v => (
          <div key={v.id} className="card text-sm">
            {v.status === 'pendente'
              ? <>Código: <b className="tracking-widest">{v.codigo}</b> <span className="text-muted">(aguardando)</span></>
              : v.status === 'ativo'
                ? <a href={`/psicologo/paciente/${v.paciente_id}`} className="font-medium text-brand-dark">{v.paciente?.nome ?? 'Paciente'} →</a>
                : <span className="text-muted">{v.paciente?.nome ?? 'Paciente'} ({v.status})</span>}
          </div>
        ))}
      </div>
    </main>
  )
}