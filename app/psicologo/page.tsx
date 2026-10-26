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
    <main className="mx-auto max-w-sm p-6 space-y-3">
      <h1 className="text-xl font-bold">Olá, {nome} (psicólogo)</h1>
      <button onClick={convidar} className="w-full bg-black text-white p-2 rounded">Gerar convite</button>
      <ul className="space-y-2">
        {vinculos.map(v => (
          <li key={v.id} className="border p-2 rounded text-sm">
            {v.status === 'pendente'
              ? <>Código: <b>{v.codigo}</b> (aguardando)</>
              : v.status === 'ativo'
                ? <a href={`/psicologo/paciente/${v.paciente_id}`} className="underline">{v.paciente?.nome ?? 'Paciente'} →</a>
                : <>{v.paciente?.nome ?? 'Paciente'} ({v.status})</>}
          </li>
        ))}
      </ul>
      <button onClick={sair} className="underline text-sm">Sair</button>
    </main>
  )
}