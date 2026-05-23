const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const { verificarRegistroABRATH } = require('../servicos/abrath');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

function calcularParcelas(valorTotal, numParcelas) {
  if (numParcelas < 1) numParcelas = 1;
  const valorParcela = valorTotal / numParcelas;
  return { parcelas: numParcelas, valorParcela: parseFloat(valorParcela.toFixed(2)), valorTotal, juros: 0 };
}

router.post('/pagar', autenticar, async (req, res) => {
  const { agendamento_id, valor, forma_pagamento } = req.body;
  const r = await db.query(
    "INSERT INTO pagamentos (usuario_id, agendamento_id, tipo, valor, forma_pagamento, status) VALUES ($1, $2, 'consulta', $3, $4, 'aprovado') RETURNING id",
    [req.usuario.id, agendamento_id, valor, forma_pagamento]
  );
  await db.query("UPDATE agendamentos SET pago = 1, status = 'confirmado' WHERE id = $1", [agendamento_id]);
  res.json({ mensagem: 'Pago!', id: r.rows[0].id });
});

router.get('/meus-pagamentos', autenticar, async (req, res) => {
  const r = await db.query('SELECT * FROM pagamentos WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 50', [req.usuario.id]);
  res.json(r.rows);
});

router.post('/nota-fiscal', autenticar, async (req, res) => {
  const { pagamento_id, autorizar } = req.body;
  const pag = await db.query('SELECT * FROM pagamentos WHERE id = $1', [pagamento_id]);
  if (pag.rows[0].tipo === 'produto') {
    const nf = await db.query("INSERT INTO notas_fiscais (usuario_id, pagamento_id, tipo, valor_total, status) VALUES ($1, $2, 'nfse', $3, 'emitida') RETURNING id", [req.usuario.id, pagamento_id, pag.rows[0].valor]);
    return res.json({ mensagem: 'NF automática emitida!', id: nf.rows[0].id });
  }
  if (!autorizar) return res.json({ mensagem: 'Aguardando autorização', precisa_autorizacao: true });
  const nf = await db.query("INSERT INTO notas_fiscais (usuario_id, pagamento_id, tipo, valor_total, status, autorizada_por, data_autorizacao) VALUES ($1, $2, 'nfse', $3, 'emitida', $4, NOW()) RETURNING id", [req.usuario.id, pagamento_id, pag.rows[0].valor, req.usuario.id]);
  res.json({ mensagem: 'NF emitida!', id: nf.rows[0].id });
});

router.post('/renovar-assinatura', autenticar, async (req, res) => {
  const { plano, tipo_ciclo, parcelas, codigo_cupom, abrath_registro, abrath_nome } = req.body;

  const valores = {
    pro: { mensal: 54.90, semestral: 274.50, anual: 549 },
    premium: { mensal: 299.90, semestral: 1499.50, anual: 2999 },
    enterprise: { mensal: 599.90, semestral: 2999.50, anual: 5999 }
  };

  const valorBase = valores[plano]?.[tipo_ciclo] || 54.90;
  let valorFinal = valorBase;
  let vitalicio = false;
  let descontoAplicado = 0;

  // Cupom PRESENTEDOMAU
  if (codigo_cupom && codigo_cupom.toUpperCase() === 'PRESENTEDOMAU' && plano === 'premium') {
    vitalicio = true;
    valorFinal = 0;
    descontoAplicado = 100;
  }

  // Desconto ABRATH (15%)
  if (abrath_registro && abrath_nome && !vitalicio) {
    const verificado = await verificarRegistroABRATH(abrath_registro, abrath_nome);
    if (verificado) {
      descontoAplicado = Math.max(descontoAplicado, 15);
      valorFinal = valorBase * 0.85;
    }
  }

  // Desconto à vista (5%)
  if (['semestral', 'anual'].includes(tipo_ciclo) && parseInt(parcelas) === 1 && !vitalicio) {
    descontoAplicado = Math.max(descontoAplicado, 5);
    valorFinal = valorBase * 0.95;
  }

  const dataExpiracao = new Date();
  if (tipo_ciclo === 'mensal') dataExpiracao.setMonth(dataExpiracao.getMonth() + 1);
  else if (tipo_ciclo === 'semestral') dataExpiracao.setMonth(dataExpiracao.getMonth() + 6);
  else if (vitalicio) dataExpiracao.setFullYear(2099);
  else dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);

  const r = await db.query(
    "INSERT INTO assinaturas (usuario_id, plano, tipo_ciclo, valor, data_inicio, data_expiracao, parcelas, renovacao_automatica, status) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, 'ativa') RETURNING id",
    [req.usuario.id, plano, tipo_ciclo, valorFinal, dataExpiracao.toISOString().split('T')[0], parcelas || 1, tipo_ciclo === 'mensal' ? 1 : 0]
  );

  await db.query("UPDATE usuarios SET plano = $1, assinatura_ativa = 1, data_expiracao_assinatura = $2 WHERE id = $3", [plano, dataExpiracao.toISOString().split('T')[0], req.usuario.id]);

  res.json({
    mensagem: vitalicio ? '🎉 Assinatura Premium Vitalícia ativada!' : 'Assinatura ativada!',
    vitalicio,
    plano,
    tipo_ciclo,
    valor: valorFinal,
    desconto: descontoAplicado,
    id: r.rows[0].id
  });
});

router.get('/simular-parcelas', (req, res) => {
  const { plano, tipo_ciclo, parcelas } = req.query;
  const valores = {
    pro: { semestral: 274.50, anual: 549 },
    premium: { semestral: 1499.50, anual: 2999 },
    enterprise: { semestral: 2999.50, anual: 5999 }
  };
  const valorTotal = valores[plano]?.[tipo_ciclo] || 549;
  res.json(calcularParcelas(valorTotal, parseInt(parcelas) || 1));
});

router.post('/cancelar-assinatura', autenticar, async (req, res) => {
  const { assinatura_id } = req.body;
  const a = await db.query('SELECT * FROM assinaturas WHERE id = $1 AND usuario_id = $2', [assinatura_id, req.usuario.id]);
  if (a.rows.length === 0) return res.status(404).json({ erro: 'Assinatura não encontrada' });

  const ass = a.rows[0];
  let multa = 0;
  let valorEstorno = 0;

  if (['semestral', 'anual'].includes(ass.tipo_ciclo)) {
    const hoje = new Date();
    const inicio = new Date(ass.data_inicio);
    const mesesTotais = ass.tipo_ciclo === 'semestral' ? 6 : 12;
    const mesesUsados = Math.ceil((hoje - inicio) / (1000 * 60 * 60 * 24 * 30.44));
    const mesesRestantes = Math.max(0, mesesTotais - mesesUsados);
    const valorMensal = ass.valor / mesesTotais;
    const valorRestante = valorMensal * mesesRestantes;
    multa = valorRestante * (ass.multa_cancelamento_percentual / 100);
    valorEstorno = Math.max(0, valorRestante - multa);
  }

  await db.query("UPDATE assinaturas SET status = 'cancelada', data_cancelamento = NOW() WHERE id = $1", [assinatura_id]);
  await db.query("UPDATE usuarios SET assinatura_ativa = 0, plano = 'freemium' WHERE id = $1", [req.usuario.id]);

  res.json({
    mensagem: 'Assinatura cancelada!',
    multa: parseFloat(multa.toFixed(2)),
    valor_estorno: parseFloat(valorEstorno.toFixed(2))
  });
});

router.get('/dashboard', autenticar, async (req, res) => {
  const fat = await db.query("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status = 'aprovado'");
  const ass = await db.query("SELECT COUNT(*) as t FROM assinaturas WHERE status = 'ativa'");
  res.json({ faturamento: fat.rows[0].t, assinaturas_ativas: ass.rows[0].t });
});

module.exports = router;