"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import Link from 'next/link'

export default function MeusAnuncios() {
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<'ativos' | 'vendidos'>('ativos')
  const [userId, setUserId] = useState<string | null>(null)

  // Carrega a sessão do usuário logado via Google
  useEffect(() => {
    async function obterUsuario() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        // Se não estiver logado, redireciona para a página inicial/login
        window.location.href = "/"
      }
    }
    obterUsuario()
  }, [])

  // Busca os anúncios pertencentes estritamente a este usuário
  // Nota: Usamos a tabela original escrita (ex: 'anuncios') para permitir updates de status
  useEffect(() => {
    if (!userId) return

    async function buscarMeusDesapegos() {
      setCarregando(true)
      
      // Ajuste o nome da tabela abaixo ('anuncios') caso ela se chame diferente no seu banco
      const { data, error } = await supabase
        .from('anuncios') 
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

  // Função para mudar o status para Vendido (Inativo)
  async function marcarComoVendido(idAnuncio: number) {
    const confirmar = window.confirm("🎉 Parabéns pela venda! Deseja retirar este item do feed principal?")
    if (!confirmar) return

    try {
      const { error } = await supabase
        .from('anuncios')
        .update({ status: 'vendido' }) // Certifique-se de ter a coluna 'status' no banco
        .eq('id', idAnuncio)

      if (error) throw error

      // Atualiza o estado local na tela do usuário
      setAnuncios(prev => prev.map(item => 
        item.id === idAnuncio ? { ...item, status: 'vendido' } : item
      ))
    } catch (erro) {
      alert("Erro ao atualizar anúncio: " + erro)
    }
  }

  // Função para Excluir permanentemente o anúncio
  async function excluirAnuncio(idAnuncio: number) {
    const confirmar = window.confirm("🚨 Tem certeza que deseja excluir permanentemente este anúncio?")
    if (!confirmar) return

    try {
      const { error } = await supabase
        .from('anuncios')
        .delete()
        .eq('id', idAnuncio)

      if (error) throw error

      // Remove o item da lista local do estado
      setAnuncios(prev => prev.filter(item => item.id !== idAnuncio))
    } catch (erro) {
      alert("Erro ao excluir anúncio: " + erro)
    }
  }

  // Filtra os dados carregados de acordo com a aba selecionada pelo usuário
  const anunciosFiltrados = anuncios.filter(item => {
    if (abaAtiva === 'ativos') {
      return item.status === 'active' || !item.status // Mantém compatibilidade com nulos antigos
    } else {
      return item.status === 'vendido'
    }
  })

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen text-gray-800 shadow-lg pb-28 relative">
      
      {/* CABEÇALHO COM BOTÃO RETORNAR */}
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
          🟢 Ativos ({anuncios.filter(i => i.status === 'active' || !i.status).length})
        </button>
        <button
          onClick={() => setAbaAtiva('vendidos')}
          className={`flex-1 text-center py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            abaAtiva === 'vendidos'
              ? 'border-gray-800 text-gray-800'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          🤝 Vendidos ({anuncios.filter(i => i.status === 'vendido').length})
        </button>
      </div>

      {/* RENDERIZAÇÃO DOS ESTADOS */}
      {carregando && (
        <div className="text-center py-12 text-sm text-gray-400 animate-pulse">
          Carregando seus desapegos...
        </div>
      )}

      {/* ESTADO VAZIO COM APELO VISUAL */}
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

     // LISTA DE ANÚNCIOS (LAYOUT COMPACTO EM LINHA)
<div className="flex flex-col gap-4">
  {!carregando && anunciosFiltrados.map((item) => {
    
    // CORREÇÃO: Lê a coluna correta 'foto_url' e extrai a primeira foto do Array
    let fotoCapa = '/placeholder-infantil.png'; // Imagem de fallback se estiver vazio

    if (item.foto_url && Array.isArray(item.foto_url) && item.foto_url.length > 0) {
      fotoCapa = item.foto_url[0]; // Pega a primeira imagem do array do Postgres
    } else if (typeof item.foto_url === 'string' && item.foto_url.trim() !== '') {
      // Caso haja algum registro antigo salvo como string pura
      fotoCapa = item.foto_url;
    }

    return (
      <div key={item.id} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm items-start">
        {/* Miniatura da Foto corrigida */}
        <img 
          src={fotoCapa} 
          alt={item.titulo} 
          className="w-20 h-20 object-cover rounded-lg bg-gray-50 border flex-shrink-0"
        />

        {/* Informações Básicas e Botões de Ação */}
        <div className="flex-1 flex flex-col min-w-0 h-20 justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-700 truncate">{item.titulo}</h3>
            <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
              <span className="bg-gray-100 px-1.5 py-0.5 rounded uppercase font-medium">{item.tamanho}</span>
              <span className="bg-gray-100 px-1.5 py-0.5 rounded capitalize font-medium">{item.genero}</span>
            </div>
            <p className="text-sm font-extrabold text-gray-900 mt-1">
              R$ {Number(item.preco).toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* PAINEL DE BOTÕES DE OPERAÇÃO RÁPIDA */}
          <div className="flex gap-2 items-center mt-1">
            {item.status !== 'vendido' && (
              <button
                onClick={() => marcarComoVendido(item.id)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer border-0"
              >
                ✓ Marcar Vendido
              </button>
            )}
            <button
              onClick={() => excluirAnuncio(item.id)}
              className="bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer border-0 flex items-center gap-0.5"
            >
              🗑️ Excluir
            </button>
          </div>
        </div>
      </div>
    )
  })}
</div>

    </div>
  )
}
