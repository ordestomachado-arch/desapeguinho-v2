"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function Feed() {
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  
  // Estados para os filtros ativos na tela
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [generoFiltro, setGeneroFiltro] = useState('Todos')

  useEffect(() => {
    async function buscarDesapegos() {
      setCarregando(true)
      
      // Inicia a query buscando tudo do banco de dados
      let query = supabase.from('anuncios').select('*')

      // Aplica os filtros dinamicamente se o usuário selecionar algo diferente de 'Todos'
      if (categoriaFiltro !== 'Todos') {
        query = query.eq('categoria', categoriaFiltro)
      }
      if (generoFiltro !== 'Todos') {
        query = query.eq('genero', generoFiltro)
      }

      const { data, error } = await query.order('criado_em', { ascending: false })
      
      if (data) setAnuncios(data)
      setCarregando(false)
    }

    buscarDesapegos()
  }, [categoriaFiltro, generoFiltro]) // Executa novamente o filtro se o usuário clicar em uma tag

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen text-gray-800 shadow-lg pb-24">
      {/* Cabeçalho igual ao do Penpot */}
      <header className="flex justify-between items-center mb-6 border-b pb-3">
        <h1 className="text-xl font-bold text-[#FF7F50]">Desapeguinho</h1>
        <span className="text-sm font-medium bg-gray-50 px-3 py-1 rounded-full text-gray-600">
          📍 Porto Alegre
        </span>
      </header>

      {/* Filtros Rápidos Estilizados (Tags Clicáveis) */}
      <div className="mb-6">
        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Categorias</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['Todos', 'Roupas', 'Calçados', 'Acessórios'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                categoriaFiltro === cat 
                  ? 'bg-[#FF7F50] text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Gênero</label>
        <div className="flex gap-2">
          {['Todos', 'menino', 'menina', 'unissex'].map((gen) => (
            <button
              key={gen}
              onClick={() => setGeneroFiltro(gen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                generoFiltro === gen 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {gen}
            </button>
          ))}
        </div>
      </div>

      {/* Estado de Carregamento */}
      {carregando && (
        <div className="text-center py-12 text-sm text-gray-400 animate-pulse">
          Buscando desapegos na região...
        </div>
      )}

      {/* Lista Vazia */}
      !carregando && anuncios.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          Nenhum desapego infantil encontrado para este filtro. 👶
        </div>
      )

      {/* Grade de Produtos em Duas Colunas */}
      <div className="grid grid-cols-2 gap-4">
        {anuncios.map((item) => (
          <div key={item.id} className="border border-gray-100 rounded-2xl p-3 shadow-sm flex flex-col justify-between bg-white">
            <div>
              {/* Espaço da Foto do Penpot */}
              <div className="w-full h-36 bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-xs text-gray-300 border border-dashed border-gray-200 overflow-hidden">
                {item.foto_url ? (
                  <img src={item.foto_url} alt={item.titulo} className="object-cover h-full w-full" />
                ) : (
                  <span>Sem foto</span>
                )}
              </div>

              {/* Informações de Nicho */}
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-[#FF7F50] font-bold text-base">R$ {item.preco}</span>
                <span className="text-[10px] bg-orange-50 text-[#FF7F50] font-bold px-2 py-0.5 rounded uppercase">
                  {item.tamanho_roupa ? `Tam: ${item.tamanho_roupa}` : `Nº: ${item.tamanho_calcado}`}
                </span>
              </div>

              <h2 className="text-xs font-medium text-gray-800 line-clamp-2 min-h-[32px]">{item.titulo}</h2>
            </div>

            {/* Rodapé do Card com Bairro e Ação */}
            <div className="mt-3 pt-2 border-t border-gray-50 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] text-gray-400">
                <span>📍 {item.bairro}</span>
                <span className="capitalize">{item.estacao}</span>
              </div>
              
              {/* Link direto para o WhatsApp do vendedor da Grande Porto Alegre */}
              <a 
                href={`https://wa.me{item.whatsapp}?text=Olá! Vi seu anúncio do desapego "${item.titulo}" no aplicativo e fiquei interessada.`}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-green-500 hover:bg-green-600 text-white text-center py-2 rounded-xl text-xs font-bold block transition-all"
              >
                Chamar Whats
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
