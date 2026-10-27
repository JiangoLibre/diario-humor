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
  const [ansiedade, setAnsiedade] = useState('')
  const [sono, setSono] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('registros').select('humor, texto, privado, ansiedade, sono_horas')
      .eq('data', hoje()).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHumor(data.humor)
          setTexto(data.texto ?? '')
          setPrivado(data.privado)
          setAnsiedade(data.ansiedade === null ? '' : String(data.ansiedade))
          setSono(data.sono_horas === null ? '' : String(data.sono_horas))
        }
      })
  }, [])

  async function salvar() {
    setMsg('')
    const horas = sono.trim() === '' ? null : Number(sono.replace(',', '.'))
    if (horas !== null && (isNaN(horas) || horas < 0 || horas > 24)) {
      return setMsg('Horas de sono inválidas')
    }
    const { data } = await supabase.auth.getUser()
    const { error } = await supabase.from('registros').upsert(
      {
        paciente_id: data.user!.id,
        data: hoje(),
        humor,
        texto,
        privado,
        ansiedade: ansiedade === '' ? null : Number(ansiedade),
        sono_horas: horas,
      },
      { onConflict: 'paciente_id,data' }
    )
    setMsg(error ? error.message : 'Salvo ✅')
    if (!error) window.dispatchEvent(new Event('progresso-atualizar'))
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

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-muted">
          Ansiedade hoje (opcional)
          <select className="input" value={ansiedade} onChange={e => setAnsiedade(e.target.value)}>
            <option value="">—</option>
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>
                {i === 0 ? '0 (nenhuma)' : i === 10 ? '10 (máxima)' : i}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted">
          Horas de sono (opcional)
          <input className="input" type="number" min="0" max="24" step="0.5" placeholder="Ex: 7.5"
            value={sono} onChange={e => setSono(e.target.value)} />
        </label>
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