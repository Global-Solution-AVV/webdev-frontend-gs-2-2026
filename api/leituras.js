// /api/leituras — leituras do sensor dos pontos de identificação (spec §6.4).
// POST com X-Device-Key (ESP32 / simulação): grava nível do silo, temperatura e umidade.
// GET ?dispositivo_id=&limite= (coordenação): histórico de um ponto, do mais recente ao mais antigo.
import { rotas, corpo, checar, HttpErro } from './_lib/http.js'
import { exigirUsuario, dispositivoPelaChave } from './_lib/auth.js'
import { supabaseAdmin } from './_lib/supabase.js'
import { numero } from './_lib/validacao.js'
import { validarLeitura } from './_lib/regras/leituras.js'

const CAMPOS = 'id, medido_em, nivel_silo_pct, temperatura_c, umidade_pct, estado'

export default rotas({
  async POST(req) {
    if (!req.headers['x-device-key']) {
      throw new HttpErro(401, 'Envie a chave do ponto no cabeçalho X-Device-Key')
    }
    const dispositivo = await dispositivoPelaChave(req)
    if (!dispositivo) throw new HttpErro(401, 'Chave de dispositivo inválida')
    const dados = corpo(req)
    if (dados.ponto && String(dados.ponto).toUpperCase() !== dispositivo.codigo) {
      throw new HttpErro(403, 'O "ponto" não corresponde à chave enviada')
    }

    const leitura = validarLeitura(dados)
    if (!leitura.ok) throw new HttpErro(422, leitura.erro)

    return checar(
      await supabaseAdmin()
        .from('leituras_dispositivo')
        .insert({ dispositivo_id: dispositivo.id, ...leitura.dados })
        .select('id, medido_em')
        .single(),
      'Leitura',
    )
  },

  async GET(req) {
    await exigirUsuario(req, 'coordenacao')
    const dispositivoId = req.query.dispositivo_id
    if (!dispositivoId) throw new HttpErro(422, 'Informe o dispositivo_id')
    const limite = req.query.limite
      ? numero(req.query.limite, 'limite', { min: 1, max: 200, inteiro: true })
      : 36
    return checar(
      await supabaseAdmin()
        .from('leituras_dispositivo')
        .select(CAMPOS)
        .eq('dispositivo_id', dispositivoId)
        .order('medido_em', { ascending: false })
        .limit(limite),
      'Leituras',
    )
  },
})
