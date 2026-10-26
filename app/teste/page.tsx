import { supabase } from '@/lib/supabase'

export default async function Teste() {
  const { error } = await supabase.from('perfis').select('id').limit(1)
  return (
    <main className="p-8">
      <h1 className="text-xl font-bold">Teste de conexão</h1>
      <p>{error ? `❌ Erro: ${error.message}` : '✅ Conectado ao Supabase'}</p>
    </main>
  )
}