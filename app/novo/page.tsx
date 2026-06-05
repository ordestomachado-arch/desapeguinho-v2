"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import Link from 'next/link'

export default function Feed() {
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [generoFiltro, setGeneroFiltro] = useState('Todos')
  const [cidadeFiltro, setCidadeFiltro] = useState('Porto Alegre')

  // ESTADOS PARA O MODAL DA GALERIA
  const [modalAberto, setModalAberto] = useState(false)
  const [fotosModal, setFotosModal] = useState<string[]>([])
  const [fotoIndexAtivo, setFotoIndexAtivo] = useState(0)

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
      const { data } = await supabase
        .from('anuncios')
        .select('*, perfis(whatsapp, nome)')
        .eq('cidade', cidadeFiltro)
        .order('id', { ascending: false })

      let dadosFiltrados = data || []

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

  const abrirGaleria = (item: any) => {
    if (!item.foto_url) return
    let listaDeFotos: string[] = []

    try {
      if (Array.isArray(item.foto_url)) {
        listaDeFotos = item.foto_url
      } else if (typeof item.foto_url === 'string' && item.foto_url.trim().startsWith('[')) {
        listaDeFotos = JSON.parse(item.foto_url)
      } else if (typeof item.foto_url === 'string') {
        listaDeFotos = item.foto_url.split(',').map((url: string) => url.trim())
      }
    } catch (erro) {
      listaDeFotos = [item.foto_url]
    }
      
    listaDeFotos = listaDeFotos.filter((url: string) => url && url.trim() !== '')
    setFotosModal(listaDeFotos)
    setFotoIndexAtivo(0)
    setModalAberto(true)
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen text-gray-800 shadow-lg pb-28 relative">
      {/* CABEÇALHO COM LINK PARA "MEUS ITENS" E SAIR */}
      <header className="flex justify-between items-center mb-6 border-b pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#FF7F50]">Desapeguinho</h1>
          <Link href="/meus-anuncios" className="text-[10px] bg-orange-50 hover:bg-orange-100 text-[#FF7F50] px-2 py-0.5 rounded-full font-bold transition-all">
            🎒 Meus Itens
          </Link>
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

  
      {/* FILTROS DE CATEGORIAS */}
      <div className="mb-6">
        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Categorias</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['Todos', 'Roupas', 'Calçados', 'Acessórios'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                categoriaFiltro === cat ? 'bg-[#FF7F50] text-white shadow-sm' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FILTROS DE GÊNERO */}
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

      {carregando && <div className="text-center py-12 text-sm text-gray-400 animate-pulse">Buscando desapegos...</div>}
      {!carregando && anuncios.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          Nenhum desapego encontrado para essa região. 👶
        </div>
      )}

      {/* GRADE DE PRODUTOS COMPLETA */}
      <div className="grid grid-cols-2 gap-4">
        {!carregando && anuncios.map((item) => {
          const perfilDono = item.perfis
          const numeroLimpo = perfilDono && perfilDono.whatsapp ? perfilDono.whatsapp.replace(/\D/g, '') : ''
          const mensagemCodificada = encodeURIComponent(`Olá! Vi seu anúncio "${item.titulo}" no Desapeguinho POA e fiquei interessada.`)
          
          // CORRIGIDO: Adicionada a barra '/' após a URL wa.me
          const linkWhats = `https://wa.me{numeroLimpo}?text=${mensagemCodificada}`

          let listaDeFotosValida: string[] = []
          if (item.foto_url) {
            if (Array.isArray(item.foto_url)) {
              listaDeFotosValida = item.foto_url
            } else if (typeof item.foto_url === 'string') {
              const textoLimpo = item.foto_url.trim()
              if (textoLimpo.startsWith('[')) {
                try {
                  listaDeFotosValida = JSON.parse(textoLimpo)
                } catch (e) {
                  listaDeFotosValida = []
                }
              } else {
                listaDeFotosValida = textoLimpo.split(',').map((url: string) => url.trim())
              }
            }
          }

          const imagemPrincipal = listaDeFotosValida.length > 0 ? listaDeFotosValida[0] : ''

          return (
            <div key={item.id} className="border border-gray-100 rounded-2xl p-3 shadow-sm flex flex-col justify-between bg-white">
              <div>
                <button 
                  type="button"
                  onClick={() => abrirGaleria(item)}
                  className="w-full h-36 bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-xs text-gray-300 border border-dashed border-gray-200 overflow-hidden cursor-pointer active:opacity-90 transition-opacity"
                >
                  {imagemPrincipal ? (
                    <img src={imagemPrincipal} alt={item.titulo} className="object-cover h-full w-full" />
                  ) : (
                    <span>Sem foto</span>
                  )}
                </button>

                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[#FF7F50] font-bold text-base">R$ {item.preco ? item.preco.toFixed(2).replace('.', ',') : '0,00'}</span>
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
                <a href={linkWhats} target="_blank" rel="noopener noreferrer" className="w-full bg-green-500 hover:bg-green-600 text-white text-center py-2 rounded-xl text-xs font-bold block transition-all">
                  Chamar Whats
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL SOBREPOSTO DA GALERIA DE FOTOS */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
          <button type="button" onClick={() => setModalAberto(false)} className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all">✕</button>
          
          {/* CORRIGIDO: Tag de fechamento posicionada corretamente após envolver as setas e a imagem ampliada */}
          <div className="w-full max-w-sm aspect-square bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-2xl">
            <img src={fotosModal[fotoIndexAtivo]} alt="Foto ampliada" className="w-full h-full object-contain" />
            
            {fotosModal.length > 1 && (
              <>
                <button type="button" onClick={() => setFotoIndexAtivo((prev) => (prev === 0 ? fotosModal.length - 1 : prev - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full text-sm font-bold">◀</button>
                <button type="button" onClick={() => setFotoIndexAtivo((prev) => (prev === fotosModal.length - 1 ? 0 : prev + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full text-sm font-bold">▶</button>
              </>
            )}
          </div>

          {/* Indicador de Páginas (Bullets inferiores) */}
          {fotosModal.length > 1 && (
            <div className="flex gap-2 mt-4">
              {fotosModal.map((_, index) => (
                <button type="button" key={index} onClick={() => setFotoIndexAtivo(index)} className={`h-2 rounded-full transition-all ${fotoIndexAtivo === index ? 'w-6 bg-[#FF7F50]' : 'w-2 bg-gray-500'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* BOTÃO FLUTUANTE ADICIONAR */}
      <Link 
        href="/cadastro" 
        className="fixed bottom-6 right-6 md:right-[calc(50%-11rem)] bg-[#FF7F50] hover:bg-[#FE7D6A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all text-3xl font-light z-45"
      >
        +
      </Link>
    </div>
  )
}

