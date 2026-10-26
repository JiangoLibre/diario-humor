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
    <main className="mx-auto max-w-sm p-6 space-y-3">
      <h1 className="text-xl font-bold">Entrar</h1>
      <input className="w-full border p-2 rounded" placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} />
      <button onClick={entrar} className="w-full bg-black text-white p-2 rounded">Entrar</button>
      {erro && <p className="text-red-600 text-sm">{erro}</p>}
      <a href="/cadastro" className="block text-sm underline">Criar conta</a>
    </main>
  )
}