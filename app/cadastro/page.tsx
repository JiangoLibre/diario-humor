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
    <main className="mx-auto max-w-sm p-6 space-y-3">
      <h1 className="text-xl font-bold">Criar conta</h1>
      <input className="w-full border p-2 rounded" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="Senha (mín. 6)" type="password" value={senha} onChange={e => setSenha(e.target.value)} />
      <select className="w-full border p-2 rounded" value={tipo} onChange={e => setTipo(e.target.value)}>
        <option value="paciente">Sou paciente</option>
        <option value="psicologo">Sou psicólogo(a)</option>
      </select>
      <p className="text-xs">
       Ao cadastrar, você concorda com a <a href="/privacidade" className="underline">Política de Privacidade</a>.
      </p>
      <button onClick={cadastrar} className="w-full bg-black text-white p-2 rounded">Cadastrar</button>
      {erro && <p className="text-red-600 text-sm">{erro}</p>}
    </main>
  )
}