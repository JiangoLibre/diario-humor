'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const rostos = ['😢', '🙁', '😐', '🙂', '😄']

function hoje() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export default function RegistroDia() {
  const [humor, setHumor] = useState(0)
  const [texto, setTexto] = useState('')
  const [privado, setPrivado] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('registros').select('humor, texto, privado')
      .eq('data', hoje()).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHumor(data.humor)
          setTexto(data.texto ?? '')
          setPrivado(data.privado)
        }
      })
  }, [])

  async function salvar() {
    setMsg('')
    const { data } = await supabase.auth.getUser()
    const { error } = await supabase.from('registros').upsert(
      { paciente_id: data.user!.id, data: hoje(), humor, texto, privado },
      { onConflict: 'paciente_id,data' }
    )
    setMsg(error ? error.message : 'Salvo ✅')
  }

  return (
    <section className="border rounded p-3 space-y-3">
      <h2 className="font-bold">Como foi seu dia?</h2>
      <div className="flex justify-between">
        {rostos.map((r, i) => (
          <button key={i} onClick={() => setHumor(i + 1)}
            className={`text-3xl p-1 rounded ${humor === i + 1 ? 'bg-gray-200 scale-125' : 'opacity-60'}`}>
            {r}
          </button>
        ))}
      </div>
      <textarea className="w-full border p-2 rounded" rows={4}
        placeholder="Escreva como foi seu dia..." value={texto}
        onChange={e => setTexto(e.target.value)} />
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={privado} onChange={e => setPrivado(e.target.checked)} />
        Privado (só eu vejo)
      </label>
      <button disabled={!humor} onClick={salvar}
        className="w-full bg-black text-white p-2 rounded disabled:opacity-40">Salvar</button>
      {msg && <p className="text-sm">{msg}</p>}
    </section>
  )
}