'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import RegistroDia from '@/components/RegistroDia'

type Vinculo = { id: string; status: string }

export default function Paciente() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [vinculo, setVinculo] = useState<Vinculo | null>(null)
  const [codigo, setCodigo] = useState('')
  const [aceito, setAceito] = useState(false)
  const [msg, setMsg] = useState('')

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('vinculos').select('id, status').eq('status', 'ativo').maybeSingle()
    setVinculo(data)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push('/login')
      const { data: p } = await supabase.from('perfis').select('nome').eq('id', data.user.id).single()
      setNome(p?.nome ?? '')
      carregar()
    })
  }, [router, carregar])

  async function aceitarConvite() {
    setMsg('')
    const { data, error } = await supabase.rpc('aceitar_convite', { p_codigo: codigo.trim() })
    if (error || data !== 'ok') return setMsg('Código inválido ou já usado')
    carregar()
  }

  async function revogar() {
    if (!vinculo) return
    await supabase.from('vinculos').update({ status: 'revogado' }).eq('id', vinculo.id)
    setVinculo(null)
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function apagarConta() {
  if (!confirm('Isso apaga sua conta e todos os seus registros. Não dá para desfazer. Continuar?')) return
  const { error } = await supabase.rpc('apagar_minha_conta')
  if (error) return alert(error.message)
  await supabase.auth.signOut()
  router.push('/cadastro')
}

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Olá, {nome} 👋</h1>
        <button onClick={sair} className="link">Sair</button>
      </header>

      <RegistroDia />

      <div className="card space-y-3">
        <h2 className="font-semibold">Acompanhamento</h2>
        {vinculo ? (
          <>
            <p className="text-sm text-muted">✅ Você está vinculado(a) a um(a) psicólogo(a).</p>
            <button onClick={revogar} className="link text-red-600">Revogar vínculo</button>
          </>
        ) : (
          <>
            <input className="input uppercase" placeholder="Código do convite" value={codigo} onChange={e => setCodigo(e.target.value)} />
            <label className="flex gap-2 text-xs text-muted">
              <input type="checkbox" checked={aceito} onChange={e => setAceito(e.target.checked)} />
              Autorizo meu(minha) psicólogo(a) a ver meus registros de humor e textos, exceto os que eu marcar como privados. Posso revogar a qualquer momento.
            </label>
            <button disabled={!aceito || !codigo} onClick={aceitarConvite} className="btn">Aceitar convite</button>
            {msg && <p className="text-sm text-red-600">{msg}</p>}
          </>
        )}
      </div>

      <p className="rounded-xl bg-brand-soft p-3 text-xs text-ink">
        Este app não é atendimento de emergência. Em crise, ligue para o <b>CVV: 188</b> (24h) ou <b>SAMU: 192</b>.
      </p>
      <button onClick={apagarConta} className="link text-red-600">Apagar minha conta e dados</button>
    </main>
  )
}