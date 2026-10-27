'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Tipo = 'phq9' | 'gad7'

const opcoes = ['Nenhuma vez', 'Vários dias', 'Mais da metade dos dias', 'Quase todos os dias']
const INTERVALO = 14

const titulo: Record<Tipo, string> = {
  phq9: 'PHQ-9 · Humor e bem-estar',
  gad7: 'GAD-7 · Ansiedade',
}

const itens: Record<Tipo, string[]> = {
  phq9: [
    'Pouco interesse ou pouco prazer em fazer as coisas',
    'Se sentir "para baixo", deprimido/a ou sem perspectiva',
    'Dificuldade para pegar no sono ou permanecer dormindo, ou dormir mais do que de costume',
    'Se sentir cansado/a ou com pouca energia',
    'Falta de apetite ou comendo demais',
    'Se sentir mal consigo mesmo/a — ou achar que você é um fracasso ou que decepcionou sua família ou você mesmo/a',
    'Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão',
    'Lentidão para se movimentar ou falar, a ponto de as outras pessoas perceberem? Ou o oposto — estar tão agitado/a ou irrequieto/a que você fica andando de um lado para o outro muito mais do que de costume',
    'Pensar em se ferir de alguma maneira ou que seria melhor estar morto/a',
  ],
  gad7: [
    'Sentir-se nervoso/a, ansioso/a ou muito tenso/a',
    'Não ser capaz de impedir ou controlar preocupações',
    'Preocupar-se muito com diversas coisas',
    'Dificuldade para relaxar',
    'Ficar tão agitado/a que se torna difícil permanecer sentado/a',
    'Ficar facilmente aborrecido/a ou irritado/a',
    'Sentir medo como se algo horrível fosse acontecer',
  ],
}

export default function Questionarios() {
  const [ultimos, setUltimos] = useState<Partial<Record<Tipo, string>>>({})
  const [ativo, setAtivo] = useState<Tipo | null>(null)
  const [resp, setResp] = useState<(number | null)[]>([])
  const [erro, setErro] = useState('')
  const [concluido, setConcluido] = useState(false)
  const [apoio, setApoio] = useState(false)

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('questionarios').select('tipo, criado_em')
      .order('criado_em', { ascending: false })
    const mapa: Partial<Record<Tipo, string>> = {}
    for (const q of data ?? []) {
      if (!mapa[q.tipo as Tipo]) mapa[q.tipo as Tipo] = q.criado_em
    }
    setUltimos(mapa)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function diasRestantes(tipo: Tipo) {
    const ult = ultimos[tipo]
    if (!ult) return 0
    const passados = Math.floor((Date.now() - new Date(ult).getTime()) / 86400000)
    return Math.max(0, INTERVALO - passados)
  }

  function abrir(tipo: Tipo) {
    setAtivo(tipo)
    setResp(Array(itens[tipo].length).fill(null))
    setErro('')
  }

  async function enviar() {
    if (!ativo) return
    if (resp.some(r => r === null)) return setErro('Responda todas as perguntas.')
    const vals = resp as number[]
    const pontuacao = vals.reduce((s, x) => s + x, 0)
    const item9 = ativo === 'phq9' ? vals[8] : null

    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('questionarios').insert({
      paciente_id: u.user!.id, tipo: ativo, respostas: vals, pontuacao, item9,
    })
    if (error) return setErro(error.message)

    setApoio((item9 ?? 0) > 0)
    setConcluido(true)
    setAtivo(null)
    window.dispatchEvent(new Event('progresso-atualizar'))
    carregar()
  }

  if (concluido) {
    return (
      <section className="card space-y-3">
        <h2 className="font-semibold">Respostas enviadas ✅</h2>
        <p className="text-sm text-muted">Obrigado por responder. Seu(sua) psicólogo(a) poderá ver o resultado.</p>
        {apoio && (
          <div className="rounded-xl bg-brand-soft p-3 text-sm">
            Você marcou que teve pensamentos de se ferir ou de que seria melhor não estar aqui.
            Isso é importante, e você não precisa passar por isso sozinho(a). Converse com seu(sua)
            psicólogo(a) assim que puder. Se estiver difícil agora, ligue para o <b>CVV: 188</b> (24h)
            ou, em risco imediato, para o <b>SAMU: 192</b>.
          </div>
        )}
        <button onClick={() => setConcluido(false)} className="link">Fechar</button>
      </section>
    )
  }

  if (ativo) {
    const respondidas = resp.filter(r => r !== null).length
    return (
      <section className="card space-y-4">
        <div>
          <h2 className="font-semibold">{titulo[ativo]}</h2>
          <p className="text-xs text-muted">
            Nas últimas 2 semanas, com que frequência você foi incomodado(a) pelos problemas abaixo?
            ({respondidas}/{itens[ativo].length})
          </p>
        </div>

        {itens[ativo].map((texto, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm">{i + 1}. {texto}</p>
            <div className="grid grid-cols-2 gap-2">
              {opcoes.map((o, v) => (
                <button key={v}
                  onClick={() => setResp(r => r.map((x, idx) => (idx === i ? v : x)))}
                  className={`rounded-xl border px-2 py-2 text-xs ${resp[i] === v ? 'border-transparent bg-brand text-white' : 'bg-white text-muted border-gray-200'}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={enviar} disabled={respondidas < itens[ativo].length} className="btn">Enviar respostas</button>
        <button onClick={() => setAtivo(null)} className="link">Cancelar</button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </section>
    )
  }

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-semibold">Questionários quinzenais</h2>
        <p className="text-xs text-muted">Leva cerca de 2 minutos. Podem ser respondidos a cada 14 dias.</p>
      </div>
      {(['phq9', 'gad7'] as const).map(t => {
        const falta = diasRestantes(t)
        return (
          <div key={t} className="flex items-center justify-between gap-3 text-sm">
            <span>{titulo[t]}</span>
            {falta > 0 ? (
              <span className="text-xs text-muted">Disponível em {falta} dia{falta > 1 ? 's' : ''}</span>
            ) : (
              <button onClick={() => abrir(t)} className="link">Responder</button>
            )}
          </div>
        )
      })}
    </section>
  )
}