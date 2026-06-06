"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Autenticacao() {
  const router = useRouter()
  const [modo, setModo] = useState<'login' | 'cadastro' | 'completar_perfil'>('login')
  
  // Estados dos campos
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  
  // Estados para as Políticas e Termos
  const [concordouTermos, setConcordouTermos] = useState(false)
  const [modalTermosAberto, setModalTermosAberto] = useState(false)
  
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    async function checarUsuarioLogado() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: perfil } = await supabase
          .from('perfis')
          .select('whatsapp')
          .eq('id', session.user.id)
          .single()

        if (perfil && perfil.whatsapp) {
          router.push('/cadastro')
        } else {
          setModo('completar_perfil')
        }
      }
    }
    checarUsuarioLogado()
  }, [router])

  const lidarComWhatsapp = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length > 11) valor = valor.slice(0, 11)
    if (valor.length > 6) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`
    } else if (valor.length > 2) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`
    } else if (valor.length > 0) {
      valor = `(${valor}`
    }
    setWhatsapp(valor)
  }

  const fazerLoginComGoogle = async () => {
    // Validação preventiva: se estiver no modo cadastro, obriga a aceitar os termos antes do clique do Google
    if (modo === 'cadastro' && !concordouTermos) {
      setMensagem('⚠️ Você precisa aceitar as Políticas de Venda antes de continuar com o Google.')
      return
    }
    
    setCarregando(true)
    setMensagem('')
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    })

    if (error) {
      setMensagem('❌ Erro ao conectar com o Google: ' + error.message)
      setCarregando(false)
    }
  }

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Bloqueia o envio se não concordar com as regras (apenas nos modos de entrada de novas vendedoras)
    if ((modo === 'cadastro' || modo === 'completar_perfil') && !concordouTermos) {
      setMensagem('⚠️ É obrigatório concordar com as Políticas de Venda para anunciar.')
      return
    }

    setCarregando(true)
    setMensagem('')
    const whatsappLimpo = whatsapp.replace(/\D/g, '')

    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
        router.push('/cadastro')
      } 
      
      else if (modo === 'cadastro') {
        const { data, error } = await supabase.auth.signUp({ 
          email: email, 
          password: senha,
          options: {
            // Enviamos os dados do vendedor empacotados junto com a criação da conta
            data: {
              full_name: nome,
              whatsapp_cadastro: whatsappLimpo
            }
          }
        })
        
        if (error) throw error

        // Mensagem direta sem pedir validação de e-mail, já que desativamos no painel
        setMensagem('🎉 Conta criada com sucesso! Você já pode anunciar seus desapegos.')
      }


      
      else if (modo === 'completar_perfil') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('perfis').upsert([
          { 
            id: user.id, 
            nome: user.user_metadata.full_name || 'Anunciante Google', 
            whatsapp: whatsappLimpo,
            aceitou_termos: true
          }
        ])

        if (error) throw error
        router.push('/cadastro')
      }
    } catch (err: any) {
      setMensagem('❌ ' + err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen text-gray-800 shadow-lg flex flex-col justify-between relative">
      <div>
        <header className="mb-8 flex items-center justify-between border-b pb-4">
          <Link href="/" className="text-sm font-medium text-gray-400 hover:text-gray-600 flex items-center gap-1">
            ◀ Voltar ao Feed
          </Link>
          <span className="text-xs bg-orange-100 text-[#FF7F50] px-2 py-1 rounded-full font-semibold">Anunciante</span>
        </header>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-[#FF7F50]">Desapeguinho</h2>
          <p className="text-sm text-gray-500 mt-2">
            {modo === 'login' && 'Entre para gerenciar seus desapegos infantis'}
            {modo === 'cadastro' && 'Crie sua conta para começar a anunciar na região'}
            {modo === 'completar_perfil' && 'Quase pronto! Só precisamos do seu contato'}
          </p>
        </div>

        {mensagem && (
          <div className={`p-3 rounded-xl mb-4 text-sm text-center font-medium ${mensagem.includes('❌') || mensagem.includes('⚠️') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {mensagem}
          </div>
        )}

        {modo !== 'completar_perfil' && (
          <div className="mb-6">
            <button
              type="button"
              disabled={carregando}
              onClick={fazerLoginComGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold p-4 rounded-xl shadow-sm transition-colors disabled:bg-gray-100"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.65 0 3.13.57 4.3 1.69l3.22-3.22C17.56 1.63 14.99 1 12 1 7.37 1 3.4 3.66 1.45 7.56l3.86 3A6.98 6.98 0 0 1 12 5.04z"/>
                <path fill="#4285F4" d="M23.45 12.3c0-.82-.07-1.62-.21-2.3H12v4.35h6.42a5.5 5.5 0 0 1-2.38 3.61v3h3.83c2.24-2.06 3.58-5.1 3.58-8.66z"/>
                <path fill="#FBBC05" d="M5.31 14.44A6.95 6.95 0 0 1 5 12c0-.85.15-1.68.41-2.44l-3.86-3A11.93 11.93 0 0 0 1 12c0 2.05.52 3.98 1.43 5.7l3.88-3.26z"/>
                <path fill="#34A353" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.83-3c-1.1.74-2.5 1.18-4.13 1.18-3.17 0-5.85-2.14-6.81-5.02l-3.88 3.26C3.4 20.34 7.37 23 12 23z"/>
              </svg>
              <span>Continuar com o Google</span>
            </button>
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-xs text-gray-400 font-bold uppercase">Ou use o e-mail</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>
          </div>
        )}

        <form onSubmit={enviarFormulario} className="space-y-4">
          {modo === 'cadastro' && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Seu Nome Completo</label>
              <input type="text" required placeholder="Ex: Maria Silva" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:outline-[#FF7F50] bg-gray-50" />
            </div>
          )}

          {modo !== 'completar_perfil' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
                <input type="email" required placeholder="seu-email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:outline-[#FF7F50] bg-gray-50" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
                <input type="password" required placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:outline-[#FF7F50] bg-gray-50" />
              </div>
            </>
          )}

          {(modo === 'cadastro' || modo === 'completar_perfil') && (
            <>
              <div>
                <label className="text-xs font-bold text-[#FF7F50] uppercase">WhatsApp de Atendimento (Com DDD)</label>
                <input type="tel" required placeholder="(51) 99999-9999" value={whatsapp} onChange={lidarComWhatsapp} className="w-full mt-1 p-3 border-2 border-[#FF7F50] rounded-xl focus:outline-[#FF7F50] bg-white text-lg font-semibold" />
              </div>

              {/* CHECKBOX DE POLÍTICAS DE VENDA */}
              <div className="flex items-start gap-3 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                <input 
                  type="checkbox" 
                  id="termos" 
                  required
                  checked={concordouTermos}
                  onChange={(e) => setConcordouTermos(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#FF7F50] cursor-pointer"
                />
                <label htmlFor="termos" className="text-xs text-gray-600 cursor-pointer select-none">
                  Estou de acordo com as{' '}
                  <button 
                    type="button" 
                    onClick={() => setModalTermosAberto(true)} 
                    className="text-[#FF7F50] font-bold underline hover:text-[#ff6a33]"
                  >
                    Políticas de Venda, Comissões e Devoluções
                  </button>{' '}
                  da plataforma.
                </label>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={carregando}
            className="w-full bg-[#FF7F50] hover:bg-[#ff6a33] text-white font-bold p-4 rounded-xl shadow-md transition-colors disabled:bg-gray-400"
          >
            {carregando ? 'Processando...' : 
             modo === 'login' ? 'Entrar' : 
             modo === 'cadastro' ? 'Criar Minha Conta e Aceitar Termos' : 'Concluir Cadastro e Avançar'}
          </button>
        </form>
      </div>

      {/* Alternador de Modo (Login / Cadastro) no rodapé */}
      {modo !== 'completar_perfil' && (
        <div className="mt-8 text-center border-t pt-4 text-sm text-gray-500">
          {modo === 'login' ? (
            <p>
              Não tem uma conta de anunciante?{' '}
              <button 
                type="button" 
                onClick={() => { setModo('cadastro'); setMensagem(''); }} 
                className="text-[#FF7F50] font-bold hover:underline"
              >
                Cadastre-se aqui
              </button>
            </p>
          ) : (
            <p>
              Já possui uma conta ativa?{' '}
              <button 
                type="button" 
                onClick={() => { setModo('login'); setMensagem(''); }} 
                className="text-[#FF7F50] font-bold hover:underline"
              >
                Acesse sua conta
              </button>
            </p>
          )}
        </div>
      )}

      {/* MODAL / BOTTOM SHEET DAS POLÍTICAS DE VENDA */}
      {modalTermosAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fadeIn p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between animate-slideUp">
            <div>
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="font-bold text-base text-gray-800">📜 Políticas de Venda e Regras</h3>
                <button 
                  type="button" 
                  onClick={() => setModalTermosAberto(false)} 
                  className="text-gray-400 text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              
              {/* Corpo do Texto das Regras */}
              <div className="space-y-4 overflow-y-auto text-xs text-gray-600 pr-1 max-h-[50vh] leading-relaxed">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">1. Taxa de Comissão da Plataforma</h4>
                  <p>O Desapeguinho POA opera com uma comissão de <strong>10% sobre o valor de cada item vendido</strong> através da intermediação da plataforma, retida no momento do repasse do saldo.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">2. Estado de Conservação e Fotos</h4>
                  <p>O vendedor se compromete a publicar fotos reais e atuais dos desapegos infantis, apontando obrigatoriamente na descrição qualquer marca de uso, mancha, bolinha ou avaria na peça.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">3. Casos de Devolução de Mercadoria</h4>
                  <p>Caso o comprador retire ou receba o produto e constate que este <strong>não está em conformidade com o anunciado</strong> (ex: tamanho errado, defeito ocultado), ele terá o prazo de até <strong>7 dias corridos</strong> para solicitar a devolução e o reembolso integral.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">4. Logística de Entrega</h4>
                  <p>A entrega, envio ou ponto de encontro para retirada na Região Metropolitana de Porto Alegre é de responsabilidade mútua entre comprador e vendedor, conforme combinado pelo canal oficial.</p>
                </div>
              </div>
            </div>

            {/* Botão de Fechamento/Aceite Interno */}
            <button 
              type="button" 
              onClick={() => { setConcordouTermos(true); setModalTermosAberto(false); }}
              className="w-full mt-6 bg-[#FF7F50] text-white text-xs font-bold py-3.5 rounded-xl hover:bg-[#ff6a33]"
            >
              Li e concordo com as regras
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

