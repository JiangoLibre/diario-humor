'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Reg = { id: string; data: string; humor: number; texto: string | null; ansiedade: number | null; sono_horas: number | null }
type Quest = { id: string; tipo: 'phq9' | 'gad7'; pontuacao: number; item9: number | null; criado_em: string }

const rostos = ['😢', '🙁', '😐', '🙂', '😄']

// Valores iniciais para sinalização. NÃO são pontos de corte validados:
// ajuste junto com a psicóloga.
const LIMITES = { humorQueda: 0.5, ansiedadeAlta: 1.5, phqAlta: 5, gadAlta: 4, adesaoMin: 0.5 }
const MAX_DIAS = 90

function iso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}
function somaDias(dataIso: string, n: number) {
  const d = new Date(dataIso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return iso(d)
}
function diasEntre(a: string, b: string) {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000)
}
function br(d: string) {
  return `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`
}
function faixa(tipo: 'phq9' | 'gad7', p: number) {
  if (p <= 4) return 'Mínima'
  if (p <= 9) return 'Leve'
  if (p <= 14) return 'Moderada'
  if (tipo === 'phq9') return p <= 19 ? 'Moderadamente grave' : 'Grave'
  return 'Grave'
}
function media(l: Reg[], c: 'humor' | 'ansiedade' | 'sono_horas') {
  const v = l.map(r => r[c]).filter((x): x is number => x !== null && x !== undefined)
  return v.length ? v.reduce((s, x) => s + Number(x), 0) / v.length : null
}
function comparar(atual: number | null, ant: number | null, sufixo = '') {
  if (atual === null) return '-'
  const base = `${atual.toFixed(1)}${sufixo}`
  if (ant === null) return base
  const d = atual - ant
  const seta = Math.abs(d) < 0.05 ? '→' : d > 0 ? '↑' : '↓'
  return `${base} (${seta} ${Math.abs(d).toFixed(1)} vs. anterior)`
}
function periodo(ult: string | null, hoje: string) {
  let inicio = ult ? somaDias(ult, 1) : somaDias(hoje, -13)
  let limitado = false
  if (diasEntre(inicio, hoje) + 1 > MAX_DIAS) {
    inicio = somaDias(hoje, -(MAX_DIAS - 1))
    limitado = true
  }
  const tamanho = diasEntre(inicio, hoje) + 1
  return { inicio, tamanho, limitado, antInicio: somaDias(inicio, -tamanho), antFim: somaDias(inicio, -1) }
}

export default function ResumoSessao({ pacienteId }: { pacienteId: string }) {
  const [ultima, setUltima] = useState<{ id: string; data: string } | null>(null)
  const [dataNova, setDataNova] = useState('')
  const [regs, setRegs] = useState<Reg[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [marcados, setMarcados] = useState<string[]>([])
  const [aberto, setAberto] = useState(true)
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState('')

  const hoje = iso(new Date())

  const carregar = useCallback(async () => {
    const { data: s } = await supabase
      .from('sessoes').select('id, data')
      .eq('paciente_id', pacienteId).order('data', { ascending: false }).limit(1).maybeSingle()
    setUltima(s)

    const p = periodo(s?.data ?? null, hoje)
    if (p.tamanho > 0) {
      const { data: r } = await supabase
        .from('registros').select('id, data, humor, texto, ansiedade, sono_horas')
        .eq('paciente_id', pacienteId)
        .gte('data', p.antInicio).lte('data', hoje).order('data')
      const lista = (r ?? []) as Reg[]
      setRegs(lista)
      const ids = lista.filter(x => x.data >= p.inicio).map(x => x.id)
      if (ids.length) {
        const { data: d } = await supabase.from('destaques').select('registro_id').in('registro_id', ids)
        setMarcados((d ?? []).map(x => x.registro_id as string))
      } else setMarcados([])
    } else {
      setRegs([])
      setMarcados([])
    }

    const { data: q } = await supabase
      .from('questionarios').select('id, tipo, pontuacao, item9, criado_em')
      .eq('paciente_id', pacienteId).order('criado_em', { ascending: false })
    setQuests((q ?? []) as Quest[])
    setDataNova(prev => prev || hoje)
    setPronto(true)
  }, [pacienteId, hoje])

  useEffect(() => { carregar() }, [carregar])

  async function registrarSessao() {
    setErro('')
    if (dataNova > hoje) return setErro('A data não pode ser futura.')
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('sessoes').insert({
      psicologo_id: u.user!.id, paciente_id: pacienteId, data: dataNova,
    })
    if (error) return setErro(error.code === '23505' ? 'Essa sessão já foi registrada.' : error.message)
    carregar()
  }

  async function removerSessao() {
    if (!ultima) return
    await supabase.from('sessoes').delete().eq('id', ultima.id)
    carregar()
  }

  if (!pronto) return <section className="card text-sm text-muted">Carregando resumo...</section>

  const p = periodo(ultima?.data ?? null, hoje)
  const atuais = regs.filter(r => r.data >= p.inicio)
  const anteriores = regs.filter(r => r.data < p.inicio)

  const mh = media(atuais, 'humor'), mhA = media(anteriores, 'humor')
  const ma = media(atuais, 'ansiedade'), maA = media(anteriores, 'ansiedade')
  const ms = media(atuais, 'sono_horas'), msA = media(anteriores, 'sono_horas')
  const adesao = p.tamanho > 0 ? atuais.length / p.tamanho : 0

  const melhor = atuais.length ? atuais.reduce((a, b) => (b.humor >= a.humor ? b : a)) : null
  const pior = atuais.length ? atuais.reduce((a, b) => (b.humor <= a.humor ? b : a)) : null

  const dois = (tipo: 'phq9' | 'gad7') => {
    const l = quests.filter(q => q.tipo === tipo)
    return { ult: l[0], ant: l[1] }
  }
  const phq = dois('phq9'), gad = dois('gad7')
  const item9 = quests.some(q => q.tipo === 'phq9' && (q.item9 ?? 0) > 0 && iso(new Date(q.criado_em)) >= p.inicio)

  const alertas: string[] = []
  if (p.tamanho > 0) {
    if (item9) alertas.push('O item 9 do PHQ-9 foi marcado neste período.')
    if (mh !== null && mhA !== null && mhA - mh >= LIMITES.humorQueda)
      alertas.push(`Humor médio caiu ${(mhA - mh).toFixed(1)} ponto(s) em relação ao período anterior.`)
    if (ma !== null && maA !== null && ma - maA >= LIMITES.ansiedadeAlta)
      alertas.push(`Ansiedade média subiu ${(ma - maA).toFixed(1)} ponto(s) em relação ao período anterior.`)
    if (phq.ult && phq.ant && phq.ult.pontuacao - phq.ant.pontuacao >= LIMITES.phqAlta)
      alertas.push(`PHQ-9 subiu ${phq.ult.pontuacao - phq.ant.pontuacao} pontos (${phq.ant.pontuacao} → ${phq.ult.pontuacao}).`)
    if (gad.ult && gad.ant && gad.ult.pontuacao - gad.ant.pontuacao >= LIMITES.gadAlta)
      alertas.push(`GAD-7 subiu ${gad.ult.pontuacao - gad.ant.pontuacao} pontos (${gad.ant.pontuacao} → ${gad.ult.pontuacao}).`)
    if (adesao < LIMITES.adesaoMin)
      alertas.push(`Poucos registros visíveis (${atuais.length} de ${p.tamanho} dias). Interprete as médias com cautela.`)
  }

  const destacados = atuais.filter(r => marcados.includes(r.id))
  const caixa = 'rounded-xl bg-brand-soft p-3'

  function linhaQuest(tipo: 'phq9' | 'gad7', nome: string, q: { ult?: Quest; ant?: Quest }) {
    if (!q.ult) return <li key={tipo}>{nome}: nenhum respondido.</li>
    return (
      <li key={tipo}>
        {nome}: <b>{q.ult.pontuacao}</b> ({faixa(tipo, q.ult.pontuacao)}) em {new Date(q.ult.criado_em).toLocaleDateString('pt-BR')}
        {q.ant && <span className="text-muted"> · antes: {q.ant.pontuacao} ({faixa(tipo, q.ant.pontuacao)})</span>}
      </li>
    )
  }

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Resumo pré-sessão</h2>
        <button onClick={() => setAberto(!aberto)} className="link">{aberto ? 'Recolher' : 'Expandir'}</button>
      </div>

      {aberto && (
        <>
          <div className="space-y-2 text-sm">
            {ultima ? (
              <p>
                Última sessão: <b>{br(ultima.data)}</b>{' '}
                <button onClick={removerSessao} className="link text-red-600">Remover</button>
              </p>
            ) : (
              <p className="text-muted">Nenhuma sessão registrada. Mostrando os últimos 14 dias.</p>
            )}
            <div className="flex items-end gap-2">
              <label className="flex-1 space-y-1 text-xs text-muted">
                Sessão realizada em
                <input type="date" className="input" value={dataNova} max={hoje} onChange={e => setDataNova(e.target.value)} />
              </label>
              <button onClick={registrarSessao} className="btn" style={{ width: 'auto' }}>Registrar</button>
            </div>
            {erro && <p className="text-red-600">{erro}</p>}
          </div>

          {p.tamanho <= 0 ? (
            <p className="text-sm text-muted">Sessão registrada hoje. O resumo passa a contar a partir de amanhã.</p>
          ) : (
            <>
              <p className="text-xs text-muted">
                Período: {br(p.inicio)} a {br(hoje)} ({p.tamanho} dia{p.tamanho > 1 ? 's' : ''}) · comparado com {br(p.antInicio)} a {br(p.antFim)}
                {p.limitado && ` · limitado a ${MAX_DIAS} dias`}
              </p>

              <div className={caixa}>
                <p className="mb-1 text-sm font-semibold">Pontos de atenção</p>
                {alertas.length === 0 ? (
                  <p className="text-sm text-muted">Nenhum ponto de atenção pelos critérios atuais.</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {alertas.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={caixa}><p className="text-xs text-muted">Registros visíveis</p><b>{atuais.length} de {p.tamanho} dias</b></div>
                <div className={caixa}><p className="text-xs text-muted">Humor médio (1-5)</p><b>{comparar(mh, mhA)}</b></div>
                <div className={caixa}><p className="text-xs text-muted">Ansiedade média (0-10)</p><b>{comparar(ma, maA)}</b></div>
                <div className={caixa}><p className="text-xs text-muted">Sono médio</p><b>{comparar(ms, msA, ' h')}</b></div>
              </div>

              {melhor && pior && (
                <div className="space-y-1 text-sm">
                  <p>
                    Melhor dia: <b>{br(melhor.data)}</b> {rostos[melhor.humor - 1]}
                    {melhor.texto && <span className="text-muted"> · {melhor.texto.slice(0, 80)}{melhor.texto.length > 80 ? '…' : ''}</span>}
                  </p>
                  <p>
                    Pior dia: <b>{br(pior.data)}</b> {rostos[pior.humor - 1]}
                    {pior.texto && <span className="text-muted"> · {pior.texto.slice(0, 80)}{pior.texto.length > 80 ? '…' : ''}</span>}
                  </p>
                </div>
              )}

              <ul className="space-y-1 text-sm">
                {linhaQuest('phq9', 'PHQ-9', phq)}
                {linhaQuest('gad7', 'GAD-7', gad)}
              </ul>

              {destacados.length > 0 && (
                <div className="text-sm">
                  <p className="font-semibold">⭐ Dias marcados no período</p>
                  <ul className="space-y-1">
                    {destacados.map(r => (
                      <li key={r.id} className="text-muted">
                        <b className="text-ink">{br(r.data)}</b> {rostos[r.humor - 1]}
                        {r.texto && <> · {r.texto.slice(0, 80)}{r.texto.length > 80 ? '…' : ''}</>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted">
                Indicadores de apoio, não de diagnóstico. Dias marcados como privados pelo paciente não entram neste resumo.
              </p>
            </>
          )}
        </>
      )}
    </section>
  )
}