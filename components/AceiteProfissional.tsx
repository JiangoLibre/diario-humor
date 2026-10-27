'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AceiteProfissional() {
  const [pendente, setPendente] = useState(false)
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: p } = await supabase
        .from('perfis').select('aceite_termos_em').eq('id', data.user.id).single()
      setPendente(!p?.aceite_termos_em)
    })
  }, [])

  async function aceitar() {
    setErro('')
    const { data } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('perfis')
      .update({ aceite_termos_em: new Date().toISOString() })
      .eq('id', data.user!.id)
    if (error) return setErro(error.message)
    setPendente(false)
  }

   if (!pendente) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflowY: 'auto', padding: 16, background: 'rgba(0,0,0,.6)',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="text-lg font-bold">Antes de começar</h2>
        <ul className="text-sm" style={{ listStyle: 'disc', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>Esta ferramenta apoia o acompanhamento <b>entre as sessões</b>. Ela <b>não é serviço de emergência</b> nem monitoramento em tempo real.</li>
          <li>Os registros e alertas só aparecem quando você abre o painel. Pode haver atraso entre o que o paciente escreve e o que você vê.</li>
          <li>Oriente seus pacientes sobre isso e sobre o que fazer em crise: <b>CVV 188</b> (24h) ou <b>SAMU 192</b>.</li>
          <li>Você acessa apenas dados de pacientes que aceitaram o vínculo, e é responsável pelo uso clínico dessas informações e pela guarda de qualquer dado que exportar.</li>
          <li>Os indicadores e pontuações (PHQ-9, GAD-7) são de rastreio, não de diagnóstico.</li>
        </ul>
        <p className="text-xs text-muted">
          Texto de rascunho para o protótipo. Antes de abrir ao público, revise com um advogado e confirme as normas do seu conselho profissional.
        </p>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />
          Li e concordo com os limites acima.
        </label>
        <button onClick={aceitar} disabled={!ok} className="btn">Continuar</button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>
    </div>
  )
}