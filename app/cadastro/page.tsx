"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient' 

const LOCALIDADES_METROPOLITANA: Record<string, string[]> = {
  'Porto Alegre': ['Hípica', 'Azenha', 'Pinheiro', 'Menino Deus', 'Gloria', 'Moinhos de Vento', 'Cavalhada', 'Ipanema', 'Tristeza', 'Centro', 'Restinga', 'Belem Novo', 'Zona Sul', 'Zona Norte'],
  'Canoas': ['Centro', 'Marechal Rondon', 'Niterói', 'Nossa Senhora das Graças', 'Mathias Velho'],
  'Gravataí': ['Centro', 'Parque dos Anjos', 'Morada do Vale'],
  'Viamão': ['Centro', 'Santa Isabel', 'Viamópolis', 'Esmeralda'],
  'Novo Hamburgo': ['Centro', 'Hamburgo Velho', 'Lomba Grande']
}


export default function CadastroAnuncio() {
  const [titulo, setTitulo] = useState('')
  const [preco, setPreco] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [bairro, setBairro] = useState('Hípica')
  const [categoria, setCategoria] = useState('Roupas')
  const [genero, setGenero] = useState('unissex')
  const [estacao, setEstacao] = useState('todas')
  const [cor, setCor] = useState('')
  const [tamanhoRoupa, setTamanhoRoupa] = useState('6M')
  const [tamanhoCalcado, setTamanhoCalcado] = useState('')

  const [cidade, setCidade] = useState('Porto Alegre')

    // Adicione este estado junto com os seus outros useState lá no topo:
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter() // Certifique-se de importar o useRouter de 'next/navigation' no topo


  useEffect(() => {

    const bairrosDaCidade = LOCALIDADES_METROPOLITANA[cidade] || []
    if (bairrosDaCidade.length > 0) {
      setBairro(bairrosDaCidade[0]) // Garante que seleciona o primeiro bairro válido da lista
    }
  }, [cidade])

  
   // Novos estados para o upload de múltiplas fotos e previews
  const [fotos, setFotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  // Proteção da página: Só deixa criar anúncio se estiver logado
  useEffect(() => {
    async function verificarSessao() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session || !session.user) {
        // Se não tiver usuário logado, joga para a tela de login
        router.push('/login')
      } else {
        // Se estiver logado, guarda o ID dele para usarmos no insert
        setUserId(session.user.id)
      }
    }
    verificarSessao()
  }, [router])

  // Controla a criação e limpeza dos previews de imagem na tela
  useEffect(() => {
    if (fotos.length === 0) {
      setPreviewUrls([])
      return
    }
    const urls = fotos.map(f => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [fotos])

  async function salvarAnuncio(e: any) {
    e.preventDefault()
    setCarregando(true)
    setMensagem('')

    if (fotos.length === 0) {
      setMensagem('❌ Por favor, selecione ao menos uma foto do desapego!')
      setCarregando(false)
      return
    }

    try {
      const urlsPublicasGeradas: string[] = []

      // Percorre a lista de fotos enviando uma por uma para o Supabase
      for (const arquivo of fotos) {
        const extensaoArquivo = arquivo.name.split('.').pop()
        // Adiciona um número aleatório junto ao timestamp para evitar conflito de nomes
        const nomeDoArquivo = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extensaoArquivo}`

        const { data: dadosUpload, error: erroUpload } = await supabase.storage
          .from('fotos-desapegos')
          .upload(nomeDoArquivo, arquivo)

        if (erroUpload) {
          setMensagem('❌ Erro no upload da imagem: ' + erroUpload.message)
          setCarregando(false)
          return
        }

        const { data: dadosUrl } = supabase.storage
          .from('fotos-desapegos')
          .getPublicUrl(nomeDoArquivo)

        urlsPublicasGeradas.push(dadosUrl.publicUrl)
      }

      // 4. Grava os dados na tabela do banco adicionando a ARRAY com as fotos
      const { error: erroBanco } = await supabase.from('anuncios').insert([
        {
          titulo,
          preco: parseFloat(preco),
          whatsapp,
          cidade,
          bairro,
          categoria,
          genero,
          estacao,
          cor,
          tamanho_roupa: categoria === 'Roupas' ? tamanhoRoupa : null,
          tamanho_calcado: categoria === 'Calçados' ? parseInt(tamanhoCalcado) : null,
          foto_url: urlsPublicasGeradas, // Envia o vetor com as URLs geradas
        }
      ])

      if (erroBanco) {
        setMensagem('❌ Erro no banco: ' + erroBanco.message)
      } else {
        setMensagem('🎉 Desapego publicado em Porto Alegre!')
        // Limpa os campos após o sucesso
        setTitulo('')
        setPreco('')
        setWhatsapp('')
        setCor('')
        setFotos([]) // Limpa a lista de arquivos
        // Reseta o input de arquivo fisicamente
        const arquivoInput = document.getElementById('foto-input') as HTMLInputElement
        if (arquivoInput) arquivoInput.value = ''
      }
    } catch (err: any) {
      setMensagem('❌ Erro de rede local: Verifique se há algum AdBlock ativo.')
    } finally {
      setCarregando(false)
    }
  }
return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen text-gray-800 shadow-lg">
      <header className="mb-6 flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold text-[#FF7F50]">Desapeguinho POA</h1>
        <span className="text-xs bg-orange-100 text-[#FF7F50] px-2 py-1 rounded-full font-semibold">Next.js Client</span>
      </header>

      {mensagem && (
        <div className={`p-3 rounded-xl mb-4 text-sm text-center font-medium ${mensagem.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {mensagem}
        </div>
      )}

      <form onSubmit={salvarAnuncio} className="space-y-4">
        {/* Bloco de Upload Ajustado para Múltiplas Fotos com Preview Lado a Lado */}
        <div className="border-2 border-dashed border-gray-200 p-4 rounded-xl text-center bg-gray-50 flex flex-col items-center justify-center min-h-[160px]">
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Fotos do Desapego (Até 3 imagens)</label>
          
          {/* Exibe as miniaturas das fotos selecionadas com barra de rolagem se necessário */}
          {previewUrls && previewUrls.length > 0 ? (
            <div className="flex gap-2 mb-3 overflow-x-auto max-w-full p-1 scrollbar-none">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white shrink-0">
                  <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-300 my-2 text-4xl">📸</div>
          )}

<input 
  type="file" 
  id="foto-input"
  required={fotos.length === 0}
  multiple // Permite selecionar várias se for abrir a galeria
  accept="image/*" 
  onChange={(e) => {
    if (e.target.files) {
      const novosArquivos = Array.from(e.target.files)
      
      setFotos((fotosAntigas) => {
        // Junta as fotos que já estavam salvas com as novas fotos tiradas
        const listaAtualizada = [...fotosAntigas, ...novosArquivos]
        
        // Trava de segurança para não deixar passar de 3 fotos
        if (listaAtualizada.length > 3) {
          alert("⚠️ Você pode selecionar no máximo 3 fotos por desapego.")
          return listaAtualizada.slice(0, 3)
        }
        
        return listaAtualizada
      })
    }
  }} 
  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#FF7F50] hover:file:bg-orange-100"
/>

        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">O que você está desapegando?</label>
          <input type="text" required placeholder="Ex: Vestido Festa Junina Infantil" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:outline-[#FF7F50]" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label>
            <input type="number" step="0.01" required placeholder="0,00" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:outline-[#FF7F50]" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Whats (com DDD)</label>
            <input type="tel" required placeholder="51999999999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:outline-[#FF7F50]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-xl focus:outline-[#FF7F50]">
              <option value="Roupas">Roupas</option>
              <option value="Calçados">Calçados</option>
              <option value="Acessórios">Acessórios</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Gênero</label>
            <select value={genero} onChange={(e) => setGenero(e.target.value)} className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-xl focus:outline-[#FF7F50]">
              <option value="unissex">Unissex</option>
              <option value="menino">Menino</option>
              <option value="menina">Menina</option>
            </select>
          </div>
        </div>

        {categoria === 'Roupas' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Tamanho da Roupa</label>
            <select value={tamanhoRoupa} onChange={(e) => setTamanhoRoupa(e.target.value)} className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-xl focus:outline-[#FF7F50]">
              <option value="RN">RN (Recém Nascido)</option>
              <option value="3M">3 Meses</option>
              <option value="6M">6 Meses</option>
              <option value="1A">1 Ano</option>
              <option value="2A">2 Anos</option>
            </select>
          </div>
        )}

        {categoria === 'Calçados' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
            <input type="number" required placeholder="Ex: 20" value={tamanhoCalcado} onChange={(e) => setTamanhoCalcado(e.target.value)} className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:outline-[#FF7F50]" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Estação</label>
            <select value={estacao} onChange={(e) => setEstacao(e.target.value)} className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-xl focus:outline-[#FF7F50]">
              <option value="todas">Todas</option>
              <option value="verao">Verão</option>
              <option value="inverno">Inverno</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Cor</label>
            <input type="text" placeholder="Ex: Rosa" value={cor} onChange={(e) => setCor(e.target.value)} className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:outline-[#FF7F50]" />
          </div>
        </div>

         {/* Seletor Dinâmico de Cidade */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Cidade de Retirada</label>
          <select 
            value={cidade} 
            onChange={(e) => setCidade(e.target.value)} 
            className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-xl focus:outline-[#FF7F50]"
          >
            {Object.keys(LOCALIDADES_METROPOLITANA).map((itemCidade) => (
              <option key={itemCidade} value={itemCidade}>{itemCidade}</option>
            ))}
          </select>
        </div>

        {/* Seletor Dinâmico de Bairro */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Bairro de Retirada</label>
          <select 
            value={bairro} 
            onChange={(e) => setBairro(e.target.value)} 
            className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-xl focus:outline-[#FF7F50]"
          >
            {(LOCALIDADES_METROPOLITANA[cidade] || []).map((itemBairro) => (
              <option key={itemBairro} value={itemBairro}>{itemBairro}</option>
            ))}
          </select>
        </div>


        <button type="submit" disabled={carregando} className="w-full bg-[#FF7F50] text-white p-4 rounded-xl font-bold transition-all hover:bg-[#FE7D6A] disabled:bg-gray-300">
          {carregando ? 'Publicando...' : 'Publicar Desapego'}
        </button>
      </form>
    </div>
  )
}

