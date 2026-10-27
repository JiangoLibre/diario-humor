'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import ResumoSessao from '@/components/ResumoSessao'

type Reg = { id: string; data: string; humor: number; texto: string | null; ansiedade: number | null; sono_horas: number | null }
type Nota = { id: string; texto: string; criada_em: string }
type Quest = { id: string; tipo: 'phq9' | 'gad7'; pontuacao: number; item9: number | null; criado_em: string }

const rostos = ['😢', '🙁', '😐', '🙂', '😄']
const freq = ['Nenhuma vez', 'Vários dias', 'Mais da metade dos dias', 'Quase todos os dias']

function faixa(tipo: 'phq9' | 'gad7', p: number) {
  if (p <= 4) return 'Mínima'
  if (p <= 9) return 'Leve'
  if (p <= 14) return 'Moderada'
  if (tipo === 'phq9') return p <= 19 ? 'Moderadamente grave' : 'Grave'
  return 'Grave'
}

const tooltipStyle = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }

function Conteudo() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [regs, setRegs] = useState<Reg[]>([])
  const [dias, setDias] = useState(30)
  const [aba, setAba] = useState<'registros' | 'questionarios' | 'notas'>('registros')
  const [verTodos, setVerTodos] = useState(false)
  const [notas, setNotas] = useState<Nota[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [novaNota, setNovaNota] = useState('')
  const [abertos, setAbertos] = useState<string[]>([])
  const [marcados, setMarcados] = useState<string[]>([])
  const [soMarcados, setSoMarcados] = useState(false)

  function alternarRegistro(rid: string) {
    setAbertos(a => (a.includes(rid) ? a.filter(x => x !== rid) : [...a, rid]))
  }

  async function carregarMarcados(ids: string[]) {
    if (ids.length === 0) return setMarcados([])
    const { data } = await supabase.from('destaques').select('registro_id').in('registro_id', ids)
    setMarcados((data ?? []).map(d => d.registro_id as string))
  }

  async function alternarMarca(rid: string) {
    if (marcados.includes(rid)) {
      setMarcados(m => m.filter(x => x !== rid))
      await supabase.from('destaques').delete().eq('registro_id', rid)
    } else {
      setMarcados(m => [...m, rid])
      const { data } = await supabase.auth.getUser()
      await supabase.from('destaques').insert({ psicologo_id: data.user!.id, registro_id: rid })
    }
  }

  async function carregarNotas() {
    const { data } = await supabase
      .from('notas').select('id, texto, criada_em')
      .eq('paciente_id', id).order('criada_em', { ascending: false })
    setNotas(data ?? [])
  }

  async function carregarQuest() {
    const { data } = await supabase
      .from('questionarios').select('id, tipo, pontuacao, item9, criado_em')
      .eq('paciente_id', id).order('criado_em', { ascending: false })
    setQuests((data ?? []) as Quest[])
  }

  async function salvarNota() {
    if (!novaNota.trim()) return
    const { data } = await supabase.auth.getUser()
    await supabase.from('notas').insert({ psicologo_id: data.user!.id, paciente_id: id, texto: novaNota.trim() })
    setNovaNota('')
    carregarNotas()
  }

  async function apagarNota(notaId: string) {
    await supabase.from('notas').delete().eq('id', notaId)
    carregarNotas()
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return router.push('/login')
      const { data: p } = await supabase.from('perfis').select('nome').eq('id', id).single()
      setNome(p?.nome ?? '')
      const desde = new Date()
      desde.setDate(desde.getDate() - dias)
      const { data: r } = await supabase
        .from('registros').select('id, data, humor, texto, ansiedade, sono_horas')
        .eq('paciente_id', id)
        .gte('data', desde.toISOString().slice(0, 10))
        .order('data')
      const lista = (r ?? []) as Reg[]
      setRegs(lista)
      carregarMarcados(lista.map(x => x.id))
      carregarNotas()
      carregarQuest()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dias, router])

  function mediaDe(campo: 'humor' | 'ansiedade' | 'sono_horas') {
    const v = regs.map(r => r[campo]).filter((x): x is number => x !== null && x !== undefined)
    return v.length ? (v.reduce((s, x) => s + Number(x), 0) / v.length).toFixed(1) : '-'
  }

  const lista = [...regs].reverse()
  const base = soMarcados ? lista.filter(r => marcados.includes(r.id)) : lista
  const visiveis = verTodos ? base : base.slice(0, 10)
  const temExtras = regs.some(r => r.ansiedade !== null || r.sono_horas !== null)
  const alertaItem9 = quests.find(q => (q.item9 ?? 0) > 0)

  const chip = (ativo: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium ${ativo ? 'bg-brand text-white' : 'bg-white text-muted border border-gray-200'}`

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <a href="/psicologo" className="link">← Voltar</a>
      <h1 className="text-xl font-bold">{nome}</h1>

      {alertaItem9 && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          ⚠️ No PHQ-9 de {new Date(alertaItem9.criado_em).toLocaleDateString('pt-BR')}, o item 9
          (pensamentos de se ferir ou de que seria melhor estar morto/a) foi marcado como: <b>{freq[alertaItem9.item9 ?? 0]}</b>.
        </div>
      )}
      <ResumoSessao pacienteId={id} />
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90, 365].map(d => (
          <button key={d} onClick={() => setDias(d)} className={chip(dias === d)}>
            {d === 365 ? '1 ano' : `${d} dias`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card"><p className="text-xs text-muted">Registros</p><p className="text-2xl font-bold">{regs.length}</p></div>
        <div className="card"><p className="text-xs text-muted">Humor médio (1-5)</p><p className="text-2xl font-bold">{mediaDe('humor')}</p></div>
        <div className="card"><p className="text-xs text-muted">Ansiedade média (0-10)</p><p className="text-2xl font-bold">{mediaDe('ansiedade')}</p></div>
        <div className="card"><p className="text-xs text-muted">Sono médio (h)</p><p className="text-2xl font-bold">{mediaDe('sono_horas')}</p></div>
      </div>

      <div className="card h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={regs}>
            <XAxis dataKey="data" tickFormatter={(d: string) => d.slice(5)} stroke="#9CA3AF" fontSize={12} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#9CA3AF" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--color-ink)' }} />
            <Line name="Humor" type="monotone" dataKey="humor" stroke="#2BB5A3" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {temExtras && (
        <div className="card h-64">
          <p className="mb-2 text-xs text-muted">Ansiedade (0-10, esquerda) e sono em horas (direita)</p>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={regs}>
              <XAxis dataKey="data" tickFormatter={(d: string) => d.slice(5)} stroke="#9CA3AF" fontSize={12} />
              <YAxis yAxisId="a" domain={[0, 10]} stroke="#9CA3AF" fontSize={12} />
              <YAxis yAxisId="s" orientation="right" domain={[0, 12]} stroke="#9CA3AF" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--color-ink)' }} />
              <Line yAxisId="a" name="Ansiedade" type="monotone" dataKey="ansiedade" stroke="#E07A5F" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line yAxisId="s" name="Sono (h)" type="monotone" dataKey="sono_horas" stroke="#6C8EAD" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setAba('registros')} className={chip(aba === 'registros')}>Registros</button>
        <button onClick={() => setAba('questionarios')} className={chip(aba === 'questionarios')}>Questionários</button>
        <button onClick={() => setAba('notas')} className={chip(aba === 'notas')}>Minhas notas</button>
      </div>

      {aba === 'registros' && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => setAbertos(visiveis.filter(r => r.texto).map(r => r.id))} className="link">Expandir tudo</button>
            <button onClick={() => setAbertos([])} className="link">Recolher tudo</button>
            <button onClick={() => { setSoMarcados(!soMarcados); setVerTodos(false) }} className={chip(soMarcados)}>
              ⭐ Marcados ({marcados.length})
            </button>
          </div>

          {base.length === 0 && (
            <p className="text-sm text-muted">
              {soMarcados ? 'Nenhum dia marcado neste período. Toque na estrela de um registro para marcar.' : 'Nenhum registro neste período.'}
            </p>
          )}

          <ul className="space-y-2">
            {visiveis.map(r => {
              const aberto = abertos.includes(r.id)
              const marcado = marcados.includes(r.id)
              const extras = [
                r.ansiedade !== null ? `ansiedade ${r.ansiedade}/10` : '',
                r.sono_horas !== null ? `sono ${r.sono_horas}h` : '',
              ].filter(Boolean).join(' · ')
              return (
                <li key={r.id} className="card text-sm" style={{ padding: 0 }}>
                  <div className="flex items-center">
                    <button
                      onClick={() => alternarRegistro(r.id)}
                      className="flex flex-1 items-center justify-between px-4 py-3 text-left"
                    >
                      <span>
                        <b>{r.data.slice(8)}/{r.data.slice(5, 7)}/{r.data.slice(0, 4)}</b>{' '}
                        <span className="text-lg">{rostos[r.humor - 1]}</span>
                        {extras && <span className="ml-2 text-xs text-muted">{extras}</span>}
                      </span>
                      <span className="text-muted">{r.texto ? (aberto ? '▲' : '▼') : ''}</span>
                    </button>
                    <button
                      onClick={() => alternarMarca(r.id)}
                      title="Levar para a sessão"
                      aria-label="Marcar para levar à sessão"
                      className="px-3 py-3 text-lg"
                    >
                      {marcado ? '⭐' : '☆'}
                    </button>
                  </div>
                  {aberto && r.texto && <p className="px-4 pb-3 text-muted">{r.texto}</p>}
                </li>
              )
            })}
          </ul>

          {base.length > 10 && (
            <button onClick={() => setVerTodos(!verTodos)} className="link">
              {verTodos ? 'Ver menos' : `Ver todos (${base.length})`}
            </button>
          )}
        </>
      )}

      {aba === 'questionarios' && (
        <div className="space-y-3">
          {(['phq9', 'gad7'] as const).map(tipo => {
            const lst = quests.filter(q => q.tipo === tipo)
            const ult = lst[0]
            return (
              <section key={tipo} className="card space-y-2">
                <h2 className="font-semibold">
                  {tipo === 'phq9' ? 'PHQ-9 (depressão, 0-27)' : 'GAD-7 (ansiedade, 0-21)'}
                </h2>
                {!ult ? (
                  <p className="text-sm text-muted">Nenhum respondido ainda.</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold">
                      {ult.pontuacao} <span className="text-base font-medium text-muted">· {faixa(tipo, ult.pontuacao)}</span>
                    </p>
                    <p className="text-xs text-muted">Último: {new Date(ult.criado_em).toLocaleDateString('pt-BR')}</p>
                    {lst.length > 1 && (
                      <ul className="space-y-1 text-sm">
                        {lst.slice(1, 6).map(q => (
                          <li key={q.id} className="flex justify-between text-muted">
                            <span>{new Date(q.criado_em).toLocaleDateString('pt-BR')}</span>
                            <span>{q.pontuacao} · {faixa(tipo, q.pontuacao)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </section>
            )
          })}
          <p className="text-xs text-muted">
            Instrumentos de rastreio, não de diagnóstico. A interpretação é do profissional.
          </p>
        </div>
      )}

      {aba === 'notas' && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Minhas notas <span className="text-xs font-normal text-muted">(só você vê)</span></h2>
          <textarea className="input" rows={3} placeholder="Ex: perguntar sobre o sono..."
            value={novaNota} onChange={e => setNovaNota(e.target.value)} />
          <button onClick={salvarNota} disabled={!novaNota.trim()} className="btn">Salvar nota</button>
          <ul className="space-y-2">
            {notas.map(n => (
              <li key={n.id} className="rounded-xl bg-brand-soft p-3 text-sm">
                <p>{n.texto}</p>
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>{new Date(n.criada_em).toLocaleDateString('pt-BR')}</span>
                  <button onClick={() => apagarNota(n.id)} className="text-red-600">Apagar</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

export default function PacientePsi() {
  return (
    <Suspense fallback={<p className="p-6">Carregando...</p>}>
      <Conteudo />
    </Suspense>
  )
}