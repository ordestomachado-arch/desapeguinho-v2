"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Link from 'next/link'

export default function Feed() {
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  
  // Estados para os filtros ativos na tela
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [generoFiltro, setGeneroFiltro] = useState('Todos')
  const [cidadeFiltro, setCidadeFiltro] = useState('Porto Alegre')

  const LOCALIDADES_METROPOLITANA: Record<string, string[]> = {
    'Porto Alegre': ['Hípica', 'Azenha', 'Pinheiro', 'Menino Deus', 'Gloria', 'Moinhos de Vento', 'Cavalhada', 'Ipanema', 'Tristeza', 'Centro', 'Restinga', 'Belem Novo', 'Zona Sul', 'Zona Norte'],
    'Canoas': ['Centro', 'Marechal Rondon', 'Niterói', 'Nossa Senhora das Graças', 'Mathias Velho'],
    'Gravataí': ['Centro', 'Parque dos Anjos', 'Morada do Vale'],
    'Viamão': ['Centro', 'Santa Isabel', 'Viamópolis', 'Esmeralda'],
    'Novo Hamburgo': ['Centro', 'Hamburgo Velho', 'Lomba Grande']
  }

  useEffect(() => {
    async function buscarDesapegos() {
      setCarregando(true)
      
      // Busca trazendo o perfil de forma opcional (!left) para não sumir com anúncios antigos
      const { data } = await supabase
        .from('anuncios')
        .select('*, perfis:user_id!left(whatsapp, nome)')
        .order('id', { ascending: false })

      let dadosFiltrados = data || []

      // Filtros aplicados no JavaScript de forma segura
      if (cidadeFiltro !== 'Todos') {
        dadosFiltrados = dadosFiltrados.filter(item => !item.cidade || item.cidade === cidadeFiltro)
      }
      if (categoriaFiltro !== 'Todos') {
        dadosFiltrados = dadosFiltrados.filter(item => item.categoria === categoriaFiltro)
      }
      if (generoFiltro !== 'Todos') {
        dadosFiltrados = dadosFiltrados.filter(item => item.genero === generoFiltro)
      }

      setAnuncios(dadosFiltrados)
      setCarregando(false)
    }

    buscarDesapegos()
  }, [cidadeFiltro, categoriaFiltro, generoFiltro])

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen text-gray-800 shadow-lg pb-28 relative">
      {/* CABEÇALHO DINÂMICO ADICIONADO COM SUCESSO */}
      <header className="flex justify-between items-center mb-6 border-b pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#FF7F50]">Desapeguinho</h1>
          <button
            type="button"
            onClick={async () => {
              const confirmar = window.confirm("👶 Deseja mesmo sair da sua conta?");
              if (confirmar) {
                await supabase.auth.signOut()
                window.location.reload()
              }
            }}
            className="text-[10px] bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-500 px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
        
        <div className="relative inline-block">
          <span className="absolute left-2.5 top-1.5 text-xs">📍</span>
          <select 
            value={cidadeFiltro}
            onChange={(e) => setCidadeFiltro(e.target.value)}
            className="pl-7 pr-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 focus:outline-none appearance-none cursor-pointer"
          >
            {Object.keys(LOCALIDADES_METROPOLITANA).map((cidade) => (
              <option key={cidade} value={cidade}>{cidade}</option>
            ))}
          </select>
        </div>
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
                categoriaFiltro === cat ? 'bg-[#FF7F50] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                generoFiltro === gen ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {gen}
            </button>
          ))}
        </div>
      </div>

      {carregando && (
        <div className="text-center py-12 text-sm text-gray-400 animate-pulse">
          Buscando desapegos na região...
        </div>
      )}

      {!carregando && anuncios.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          Nenhum desapego infantil encontrado para este filtro. 👶
        </div>
      )}

      {/* Grade de Produtos em Duas Colunas */}
      <div className="grid grid-cols-2 gap-4">
        {!carregando && anuncios.map((item) => {
          // Busca o número do WhatsApp priorizando o Perfil, com fallback para o anúncio antigo
          const perfilDono = item.perfis;
          const whatsappOrigem = perfilDono && perfilDono.whatsapp ? perfilDono.whatsapp : item.whatsapp;
          const numeroLimpo = whatsappOrigem ? whatsappOrigem.replace(/\D/g, "") : "";      
          
          const mensagemCodificada = encodeURIComponent(`Olá! Vi seu anúncio do desapego "${item.titulo}" no Desapeguinho POA e tenho interesse.`);
          const linkWhats = `https://wa.me{numeroLimpo}?text=${mensagemCodificada}`;

          // Suporte blindado para imagem única antiga ou múltiplas novas
          let imagemPrincipal = '';
          if (item.foto_url) {
            if (Array.isArray(item.foto_url) && item.foto_url.length > 0) {
              imagemPrincipal = item.foto_url[0];
            } else if (typeof item.foto_url === 'string') {
              if (item.foto_url.trim().startsWith('[')) {
                try {
                  const parseado = JSON.parse(item.foto_url);
                  imagemPrincipal = parseado[0] || '';
                } catch (e) {
                  imagemPrincipal = item.foto_url;
                }
              } else {
                imagemPrincipal = item.foto_url.split(',')[0].trim();
              }
            }
          }

          return (
            <div key={item.id} className="border border-gray-100 rounded-2xl p-3 shadow-sm flex flex-col justify-between bg-white">
              <div>
                <div className="w-full h-36 bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-xs text-gray-300 border border-dashed border-gray-200 overflow-hidden">
                  {imagemPrincipal ? (
                    <img src={imagemPrincipal} alt={item.titulo} className="object-cover h-full w-full" />
                  ) : (
                    <span>Sem foto</span>
                  )}
                </div>

                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[#FF7F50] font-bold text-base">R$ {item.preco.toFixed(2).replace('.', ',')}</span>
                  {(item.tamanho_roupa || item.tamanho_calcado) && (
                    <span className="text-[10px] bg-orange-50 text-[#FF7F50] font-bold px-2 py-0.5 rounded uppercase">
                      {item.tamanho_roupa ? `Tam: ${item.tamanho_roupa}` : `Nº: ${item.tamanho_calcado}`}
                    </span>
                  )}
                </div>

                <h2 className="text-xs font-medium text-gray-800 line-clamp-2 min-h-[32px]">{item.titulo}</h2>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-50 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>📍 {item.bairro}</span>
                  <span className="capitalize">{item.estacao}</span>
                </div>
                
                <a 
                  href={linkWhats}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-center py-2 rounded-xl text-xs font-bold block transition-all"
                >
                  Chamar Whats
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <Link 
        href="/cadastro" 
        className="fixed bottom-6 right-6 md:right-[calc(50%-11rem)] bg-[#FF7F50] hover:bg-[#FE7D6A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-orange-100 transition-all z-50 text-3xl font-light"
      >
        +
      </Link>
    </div>
  )
}
