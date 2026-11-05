// /api/deteccoes — ingestão de detecções.
// POST com cabeçalho X-Device-Key (ESP32 / script Python) ou pela coordenação logada (simulador).
// Payload compatível com deteccoes.json do Python:
// { "ponto": "DV-001", "horario": "...", "categoria": "gato", "confidence": 0.93, "chip": "..." | null }
import { rotas, corpo, checar, HttpErro } from './_lib/http.js'
import { exigirUsuario, dispositivoPelaChave } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { processarDeteccao } from './_lib/deteccoes.js'

export default rotas({
  async POST(req, res) {
    const dados = corpo(req)
    let dispositivo = await dispositivoPelaChave(req)

    if (req.headers['x-device-key']) {
      if (!dispositivo) throw new HttpErro(401, 'Chave de dispositivo inválida')
      if (dados.ponto && dados.ponto.toUpperCase() !== dispositivo.codigo) {
        throw new HttpErro(403, 'O "ponto" não corresponde à chave enviada')
      }
    } else {
      // Simulador: coordenação escolhe o dispositivo pelo código ("ponto").
      await exigirUsuario(req, 'coordenacao')
      if (!dados.ponto) throw new HttpErro(422, 'Informe o ponto (código do dispositivo)')
      const { data } = await supabaseAdmin()
        .from('dispositivos')
        .select('*')
        .eq('codigo', String(dados.ponto).toUpperCase())
        .maybeSingle()
      if (!data) throw new HttpErro(404, 'Dispositivo não encontrado')
      dispositivo = data
    }

    const resultado = await processarDeteccao(dispositivo, dados)
    res.status(200).json(resultado)
  },

  async GET(req) {
    await exigirUsuario(req, 'coordenacao')
    return checar(
      await supabaseAdmin()
        .from('deteccoes')
        .select('*, dispositivos(codigo, local_nome)')
        .order('criado_em', { ascending: false })
        .limit(100),
      'Detecções',
    )
  },
})
