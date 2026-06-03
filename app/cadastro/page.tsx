"use client"
import { useState } from 'react'
import { supabase } from '../supabaseClient' 

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
  
  // Novos estados para o upload da foto
  const [foto, setFoto] = useState<File | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function salvarAnuncio(e: any) {
    e.preventDefault()
    setCarregando(true)
    setMensagem('')

    if (!foto) {
      setMensagem('❌ Por favor, selecione uma foto do desapego!')
      setCarregando(false)
      return
    }

    try {
      // 1. Gera um nome único e seguro para a imagem usando timestamp
      const extensaoArquivo = foto.name.split('.').pop()
      const nomeDoArquivo = `${Date.now()}.${extensaoArquivo}`

      // 2. Envia o arquivo para o bucket do Supabase Storage
      const { data: dadosUpload, error: erroUpload } = await supabase.storage
        .from('fotos-desapegos') // Nome do seu Bucket Público no Supabase
        .upload(nomeDoArquivo, foto)

      if (erroUpload) {
        setMensagem('❌ Erro no upload da imagem: ' + erroUpload.message)
        setCarregando(false)
        return
      }

      // 3. Captura a URL pública do arquivo enviado
      const { data: dadosUrl } = supabase.storage
        .from('fotos-desapegos')
        .getPublicUrl(nomeDoArquivo)

      const urlDaFotoPublica = dadosUrl.publicUrl

      // 4. Grava os dados na tabela do banco adicionando a URL da foto
      const { error: erroBanco } = await supabase.from('anuncios').insert([
        {
          titulo,
          preco: parseFloat(preco),
          whatsapp,
          bairro,
          categoria,
          genero,
          estacao,
          cor,
          tamanho_roupa: categoria === 'Roupas' ? tamanhoRoupa : null,
          tamanho_calcado: categoria === 'Calçados' ? parseInt(tamanhoCalcado) : null,
          foto_url: urlDaFotoPublica, // Gravação da URL pública no banco
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
        setFoto(null)
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
        {/* Campo para carregar a foto do desapego */}
        <div className="border-2 border-dashed border-gray-200 p-4 rounded-xl text-center bg-gray-50">
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Foto do Desapego (Obrigatória)</label>
          <input 
            type="file" 
            id="foto-input"
            required
            accept="image/*" 
            onChange={(e) => setFoto(e.target.files?.[0] || null)} 
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

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Bairro de Retirada</label>
          <select value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full mt-1 p-3 bg-white border border-gray-200 rounded-xl focus:outline-[#FF7F50]">
            <option value="Hípica">Hípica</option>
            <option value="Moinhos de Vento">Moinhos de Vento</option>
            <option value="Tristeza">Tristeza</option>
            <option value="Canoas - Centro">Canoas - Centro</option>
          </select>
        </div>

        <button type="submit" disabled={carregando} className="w-full bg-[#FF7F50] text-white p-4 rounded-xl font-bold transition-all hover:bg-[#FE7D6A] disabled:bg-gray-300">
          {carregando ? 'Publicando...' : 'Publicar Desapego'}
        </button>
      </form>
    </div>
  )
}
