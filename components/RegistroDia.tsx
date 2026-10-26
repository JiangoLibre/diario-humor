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
    <section className="card space-y-4">
      <h2 className="font-semibold">Como foi seu dia?</h2>
      <div className="flex justify-between">
        {rostos.map((r, i) => (
          <button key={i} onClick={() => setHumor(i + 1)}
            className={`rounded-2xl p-2 text-3xl transition ${humor === i + 1 ? 'bg-brand-soft scale-110' : 'opacity-50 hover:opacity-100'}`}>
            {r}
          </button>
        ))}
      </div>
      <textarea className="input" rows={4} placeholder="Escreva como foi seu dia..."
        value={texto} onChange={e => setTexto(e.target.value)} />
      <label className="flex gap-2 text-sm text-muted">
        <input type="checkbox" checked={privado} onChange={e => setPrivado(e.target.checked)} />
        Privado (só eu vejo)
      </label>
      <button disabled={!humor} onClick={salvar} className="btn">Salvar</button>
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </section>
  )
}