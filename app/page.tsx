"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Link from 'next/link' // Importação adicionada para o botão de cadastro

export default function Feed() {
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  
  // Estados para os filtros ativos na tela
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [generoFiltro, setGeneroFiltro] = useState('Todos')

  // Estados para o controle do Modal e das Fotos (Passo 1 de 2)
  const [modalAberto, setModalAberto] = useState(false)
  const [fotosModal, setFotosModal] = useState<string[]>([])
  const [fotoIndexAtivo, setFotoIndexAtivo] = useState(0)


  useEffect(() => {
    async function buscarDesapegos() {
      setCarregando(true)
      
      // Inicia a query buscando tudo do banco de dados
      // CORRIGIDO: Agora busca os dados do anúncio E o WhatsApp do perfil associado
      let query = supabase.from('anuncios').select('*, perfis:user_id!left(whatsapp, nome)')


      // Aplica os filtros dinamicamente se o usuário selecionar algo diferente de 'Todos'
      if (categoriaFiltro !== 'Todos') {
        query = query.eq('categoria', categoriaFiltro)
      }
      if (generoFiltro !== 'Todos') {
        query = query.eq('genero', generoFiltro)
      }

      const { data } = await query.order('id', { ascending: false })
      
      if (data) setAnuncios(data)
      setCarregando(false)
    }

    buscarDesapegos()
  }, [categoriaFiltro, generoFiltro]) // Executa novamente o filtro se o usuário clicar em uma tag

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen text-gray-800 shadow-lg pb-28 relative">
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

      {/* Lista Vazia - Erro corrigido envolvendo a expressão lógica */}
      {!carregando && anuncios.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          Nenhum desapego infantil encontrado para este filtro. 👶
        </div>
      )}

      {/* Grade de Produtos em Duas Colunas */}
      <div className="grid grid-cols-2 gap-4">
        {!carregando && anuncios.map((item) => {
          // 1. Captura o perfil do anunciante trazido pelo relacionamento do banco
          const perfilDono = item.perfis;
          
          // 2. Fallback inteligente: Puxa o WhatsApp do perfil. Se o anúncio for muito antigo e não tiver, deixa vazio
          const whatsappOrigem = perfilDono && perfilDono.whatsapp ? perfilDono.whatsapp : (item.whatsapp || "");
          
          // 3. Limpa caracteres especiais do telefone (parênteses, traços, espaços)
          const numeroCru = whatsappOrigem.replace(/\D/g, "");      
          
          // 4. Monta o número internacional sem correr o risco de duplicar o código 55
          const numeroLimpo = numeroCru.startsWith("55") && numeroCru.length >= 12 ? numeroCru : "55" + numeroCru;

          const mensagemCodificada = encodeURIComponent("Olá! Vi seu anúncio do desapego \"" + item.titulo + "\" no Desapeguinho POA e tenho interesse.");
          
          // 5. CORRIGIDO: Agora o link recebe a variável com o número recuperado do perfil!
          const linkWhats = "https://wa.me/" + numeroLimpo + "?text=" + mensagemCodificada;


          // 1. Extração segura para suportar tanto texto antigo quanto a array de 3 fotos futura
          let listaDeFotosValida: string[] = [];
          if (item.foto_url) {
            if (Array.isArray(item.foto_url)) {
              listaDeFotosValida = item.foto_url;
            } else if (typeof item.foto_url === 'string') {
              const textoLimpo = item.foto_url.trim();
              if (textoLimpo.startsWith('[')) {
                try {
                  listaDeFotosValida = JSON.parse(textoLimpo);
                } catch (e) {
                  listaDeFotosValida = [textoLimpo];
                }
              } else {
                listaDeFotosValida = textoLimpo.split(',').map((url: string) => url.trim());
              }
            }
          }

          // Pega a primeira imagem de forma segura
          const imagemPrincipal = listaDeFotosValida[0] || '';

          // Função interna simples para disparar a abertura do modal
          const acionarCliqueFoto = () => {
            if (listaDeFotosValida.length > 0) {
              setFotosModal(listaDeFotosValida);
              setFotoIndexAtivo(0);
              setModalAberto(true);
            }
          };

          return (
            <div key={item.id} className="border border-gray-100 rounded-2xl p-3 shadow-sm flex flex-col justify-between bg-white">
              <div>
                {/* MUDANÇA: O container antigo <div> virou um <button> clicável */}
                <button 
                  type="button"
                  onClick={acionarCliqueFoto}
                  className="w-full h-36 bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-xs text-gray-300 border border-dashed border-gray-200 overflow-hidden cursor-pointer active:opacity-80 transition-opacity block"
                >
                  {imagemPrincipal ? (
                    <img src={imagemPrincipal} alt={item.titulo} className="object-cover h-full w-full" />
                  ) : (
                    <span>Sem foto</span>
                  )}
                </button>


                {/* Informações de Conexão de Nicho */}
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[#FF7F50] font-bold text-base">R$ {item.preco.toFixed(2).replace('.', ',')}</span>
                  
                  {/* Renderização condicional inteligente do tamanho */}
                  {(item.tamanho_roupa || item.tamanho_calcado) && (
                    <span className="text-[10px] bg-orange-50 text-[#FF7F50] font-bold px-2 py-0.5 rounded uppercase">
                      {item.tamanho_roupa ? `Tam: ${item.tamanho_roupa}` : `Nº: ${item.tamanho_calcado}`}
                    </span>
                  )}
                </div>

                <h2 className="text-xs font-medium text-gray-800 line-clamp-2 min-h-[32px]">{item.titulo}</h2>
              </div>

              {/* Rodapé do Card com Bairro e Ação */}
              <div className="mt-3 pt-2 border-t border-gray-50 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>📍 {item.bairro}</span>
                  <span className="capitalize">{item.estacao}</span>
                </div>
                
                {/* Link corrigido e formatado estritamente com os dados do estado */}
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

      {/* Botão Flutuante Laranja "Anunciar" (+) com alinhamento responsivo para o layout mobile */}
            {/* Botão Flutuante Laranja "Anunciar" (+) */}
      <Link 
        href="/cadastro" 
        className="fixed bottom-6 right-6 md:right-[calc(50%-11rem)] bg-[#FF7F50] hover:bg-[#FE7D6A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-orange-100 transition-all hover:scale-110 active:scale-95 z-45 text-3xl font-light"
        title="Anunciar um Desapego"
      >
        +
      </Link>

      {/* MODAL SOBREPOSTO DA GALERIA DE FOTOS */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
          {/* Botão de Fechar o Modal */}
          <button 
            type="button"
            onClick={() => setModalAberto(false)} 
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
          
          {/* Caixa da Imagem Ampliada com as setas por cima */}
          <div className="w-full max-w-sm aspect-square bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-2xl">
            <img src={fotosModal[fotoIndexAtivo]} alt="Foto ampliada do desapego" className="w-full h-full object-contain" />
            
            {/* Setas de navegação: só aparecem se o anúncio tiver mais de 1 foto */}
            {fotosModal.length > 1 && (
              <>
                <button 
                  type="button"
                  onClick={() => setFotoIndexAtivo((prev) => (prev === 0 ? fotosModal.length - 1 : prev - 1))} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold active:scale-90 transition-transform cursor-pointer"
                >
                  ◀
                </button>
                <button 
                  type="button"
                  onClick={() => setFotoIndexAtivo((prev) => (prev === fotosModal.length - 1 ? 0 : prev + 1))} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold active:scale-90 transition-transform cursor-pointer"
                >
                  ▶
                </button>
              </>
            )}
          </div>

          {/* Indicador de Páginas (Bolinhas laranjas inferiores) */}
          {fotosModal.length > 1 && (
            <div className="flex gap-2 mt-4">
              {fotosModal.map((_, index) => (
                <button 
                  type="button" 
                  key={index} 
                  onClick={() => setFotoIndexAtivo(index)} 
                  className={`h-2 rounded-full transition-all ${fotoIndexAtivo === index ? 'w-6 bg-[#FF7F50]' : 'w-2 bg-gray-500'}`} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

