'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Cadastro() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [tipo, setTipo] = useState('paciente')
  const [erro, setErro] = useState('')

  async function cadastrar() {
    setErro('')
    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error || !data.user) return setErro(error?.message ?? 'Erro ao cadastrar')

    const { error: e2 } = await supabase
      .from('perfis')
      .insert({ id: data.user.id, nome, tipo })
    if (e2) return setErro(e2.message)

    router.push(tipo === 'psicologo' ? '/psicologo' : '/paciente')
  }

return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <div className="space-y-1 text-center">
        <div className="text-4xl">🙂</div>
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="text-sm text-muted">Leva menos de um minuto</p>
      </div>
      <div className="card space-y-3">
        <input className="input" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
        <input className="input" placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input" placeholder="Senha (mín. 6)" type="password" value={senha} onChange={e => setSenha(e.target.value)} />
        <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="paciente">Sou paciente</option>
          <option value="psicologo">Sou psicólogo(a)</option>
        </select>
        <p className="text-xs text-muted">
          Ao cadastrar, você concorda com a <a href="/privacidade" className="link">Política de Privacidade</a>.
        </p>
        <button onClick={cadastrar} className="btn">Cadastrar</button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>
      <a href="/login" className="link text-center">Já tenho conta</a>
    </main>
  )
}