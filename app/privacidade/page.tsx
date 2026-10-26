export default function Privacidade() {
  return (
    <main className="mx-auto max-w-xl space-y-3 p-6 text-sm leading-relaxed">
      <a href="/cadastro" className="link">← Voltar</a>
      <h1 className="text-xl font-bold">Política de Privacidade</h1>
      <p><b>Projeto em fase de teste.</b> Este app é um protótipo.</p>

      <h2 className="font-bold">Quais dados coletamos</h2>
      <p>Nome, e-mail e senha (protegida por hash). Para pacientes: humor diário, textos escritos e a marcação de privado.</p>

      <h2 className="font-bold">Para que usamos</h2>
      <p>Apenas para o funcionamento do app e para que o(a) psicólogo(a) vinculado(a) acompanhe seus registros.</p>

      <h2 className="font-bold">Quem vê seus dados</h2>
      <p>Somente você e o(a) psicólogo(a) com quem você aceitou o vínculo. Registros marcados como privados não são exibidos a ele(a). Você pode revogar o vínculo a qualquer momento.</p>

      <h2 className="font-bold">Seus direitos (LGPD)</h2>
      <p>Você pode apagar sua conta e todos os seus dados pelo próprio app, a qualquer momento.</p>

      <h2 className="font-bold">Onde os dados ficam</h2>
      <p>Em servidores do provedor Supabase. Não vendemos nem compartilhamos dados com terceiros para publicidade.</p>

      <h2 className="font-bold">Aviso importante</h2>
      <p>Este app não é atendimento de emergência nem oferece diagnóstico ou tratamento. Em crise, ligue para o CVV: 188 ou SAMU: 192.</p>

      <h2 className="font-bold">Contato</h2>
      <p>emailteste@Mypsc.com</p>
    </main>
  )
}