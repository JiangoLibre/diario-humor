'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  async function entrar() {
    setErro('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error || !data.user) return setErro('E-mail ou senha incorretos')

    const { data: perfil } = await supabase
      .from('perfis').select('tipo').eq('id', data.user.id).single()

    router.push(perfil?.tipo === 'psicologo' ? '/psicologo' : '/paciente')
  }

    return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <div className="space-y-1 text-center">
        <div className="text-4xl">🙂</div>
        <h1 className="text-2xl font-bold">Bem-vindo(a)</h1>
        <p className="text-sm text-muted">Entre para registrar seu dia</p>
      </div>
      <div className="card space-y-3">
        <input className="input" placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input" placeholder="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} />
        <button onClick={entrar} className="btn">Entrar</button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>
      <a href="/cadastro" className="link text-center">Criar conta</a>
    </main>
  )
}