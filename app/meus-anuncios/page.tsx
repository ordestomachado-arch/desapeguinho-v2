"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import Link from 'next/link'

export default function MeusAnuncios() {
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<'ativos' | 'vendidos'>('ativos')
  const [userId, setUserId] = useState<string | null>(null)

  // 1. Carrega a sessão do usuário logado via Google
  useEffect(() => {
    async function obterUsuario() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        window.location.href = "/"
      }
    }
    obterUsuario()
  }, [])

  // 2. Busca os anúncios pertencentes estritamente a este usuário
  useEffect(() => {
    if (!userId) return

    async function buscarMeusDesapegos() {
      setCarregando(true)
      const { data, error } = await supabase
        .from('vw_anuncios') 
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false })

      if (!error && data) {
        setAnuncios(data)
      }
      setCarregando(false)
    }

    buscarMeusDesapegos()
  }, [userId])

  // 3. Função para mudar o status manualmente (Venda física/externa ao app)
  async function marcarComoVendido(idAnuncio: number) {
    const confirmar = window.confirm("🎉 Parabéns pela venda! Deseja retirar este item do feed principal?")
    if (!confirmar) return

    try {
      const { error } = await supabase
        .from('anuncios')
        .update({ status: 'vendido' }) 
        .eq('id', idAnuncio)

      if (error) throw error

      setAnuncios(prev => prev.map(item => 
        item.id === idAnuncio ? { ...item, status: 'vendido' } : item
      ))
    } catch (erro) {
      alert("Erro ao atualizar anúncio: " + erro)
    }
  }

  // 4. Função para Excluir permanentemente o anúncio
  async function excluirAnuncio(idAnuncio: number) {
    const confirmar = window.confirm("🚨 Tem certeza que deseja excluir permanentemente este anúncio?")
    if (!confirmar) return

    try {
      const { error } = await supabase
        .from('anuncios')
        .delete()
        .eq('id', idAnuncio)

      if (error) throw error

      setAnuncios(prev => prev.filter(item => item.id !== idAnuncio))
    } catch (erro) {
      alert("Erro ao excluir anúncio: " + erro)
    }
  }

  // 5. Filtros padronizados para evitar bugs de string (compatível com 'active' e 'disponivel')
  const anunciosFiltrados = anuncios.filter(item => {
    const statusAtual = item.status?.toLowerCase()
    if (abaAtiva === 'ativos') {
      return statusAtual === 'active' || statusAtual === 'disponivel' || !statusAtual
    } else {
      // Itens vendidos pelo app passam por estados como 'pago' ou 'em_transito'
      return ['vendido', 'pago', 'em_transito', 'entregue'].includes(statusAtual)
    }
  })

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen text-gray-800 shadow-lg pb-28 relative">
      
      {/* CABEÇALHO */}
      <header className="flex justify-between items-center mb-6 border-b pb-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-500 text-sm font-medium hover:text-gray-700 flex items-center gap-1">
            ⬅️ Voltar
          </Link>
          <h1 className="text-xl font-bold text-gray-800 ml-2">Meus Anúncios</h1>
        </div>
      </header>

      {/* CONTROLE DE ABAS (TABS) */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setAbaAtiva('ativos')}
          className={`flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            abaAtiva === 'ativos'
              ? 'border-[#FF7F50] text-[#FF7F50]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          🟢 Ativos ({anuncios.filter(i => i.status === 'active' || i.status === 'disponivel' || !i.status).length})
        </button>
        <button
          onClick={() => setAbaAtiva('vendidos')}
          className={`flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            abaAtiva === 'vendidos'
              ? 'border-gray-800 text-gray-800'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          🤝 Vendidos ({anuncios.filter(i => ['vendido', 'pago', 'em_transito', 'entregue'].includes(i.status)).length})
        </button>
      </div>

      {/* RENDERIZAÇÃO DOS ESTADOS */}
      {carregando && (
        <div className="text-center py-12 text-sm text-gray-400 animate-pulse">
          Carregando seus desapegos...
        </div>
      )}

      {/* ESTADO VAZIO */}
      {!carregando && anunciosFiltrados.length === 0 && (
        <div className="text-center py-16 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
          <p className="text-sm text-gray-400 mb-4">
            {abaAtiva === 'ativos' 
              ? "Você não tem nenhuma roupinha ativa anunciada no momento. 👶" 
              : "Nenhum histórico de itens vendidos por aqui ainda."}
          </p>
          {abaAtiva === 'ativos' && (
            <Link href="/anunciar" className="inline-block px-5 py-2.5 bg-[#FF7F50] text-white text-xs font-bold rounded-full shadow-md hover:bg-[#ff6a33] transition-all">
              ➕ Desapegar Agora
            </Link>
          )}
        </div>
      )}

      {/* LISTA DE ANÚNCIOS */}
      <div className="flex flex-col gap-4">
        {!carregando && anunciosFiltrados.map((item) => {
          
          let fotoCapa = '/placeholder-infantil.png';
          if (item.foto_url && Array.isArray(item.foto_url) && item.foto_url.length > 0) {
            fotoCapa = item.foto_url[0];
          } else if (typeof item.foto_url === 'string' && item.foto_url.trim() !== '') {
            fotoCapa = item.foto_url;
          }

          return (
            <div key={item.id} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm items-start">
              <img 
                src={fotoCapa} 
                alt={item.titulo} 
                className="w-20 h-20 object-cover rounded-lg bg-gray-50 border flex-shrink-0"
              />

              <div className="flex-1 flex flex-col min-w-0 min-h-[80px] justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-700 truncate">{item.titulo}</h3>
                  <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded uppercase font-medium">
                      {item.tamanho_roupa || item.tamanho_calcado || 'U'}
                    </span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded capitalize font-medium">
                      {item.genero}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-gray-900 mt-1">
                    R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                {/* PAINEL DE BOTÕES INTELIGENTE */}
                <div className="flex gap-2 items-center mt-2 pt-1 border-t border-gray-50">
                  {/* SE O ITEM FOI VENDIDO DENTRO DO APP (Fluxo Mercado Pago/Lalamove) */}
                  {['pago', 'em_transito'].includes(item.status) && (
                    <div className="w-full flex justify-between items-center bg-blue-50 p-1.5 rounded text-[10px] text-blue-700 font-medium">
                      <span>🛵 {item.delivery_method === 'motoboy' ? 'Motoboy Lalamove acionado' : 'Aguardando Retirada'}</span>
                      {item.delivery_method === 'retirada' && (
                        <button className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[9px] border-0 cursor-pointer">
                          📷 Escanear QR
                        </button>
                      )}
                    </div>
                  )}

                  {/* FLUXO TRADICIONAL PARA ITENS ATIVOS */}
                  {(item.status === 'active' || item.status === 'disponivel' || !item.status) && (
                    <>
                      <button
                        onClick={() => marcarComoVendido(item.id)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer border-0"
                      >
                        ✓ Vendi por fora
                      </button>
                      <button
                        onClick={() => excluirAnuncio(item.id)}
                        className="bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-500 text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer border-0 ml-auto"
                      >
                        🗑️ Excluir
                      </button>
                    </>
                  )}

                  {/* STATUS FINAL DE ENTREGUE */}
                  {['vendido', 'entregue'].includes(item.status) && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      🎉 Venda Finalizada
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
