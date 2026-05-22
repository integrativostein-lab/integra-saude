const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

// Parcelamento: até 4x sem juros
function calcularParcelas(valorTotal, numParcelas) {
  if (numParcelas < 1) numParcelas = 1;
  if (numParcelas > 4) numParcelas = 4;
  const valorParcela = valorTotal / numParcelas;
  return {
    parcelas: numParcelas,
    valorParcela: parseFloat(valorParcela.toFixed(2)),
    valorTotal: valorTotal,
    juros: 0,
    taxaMensal: '0% (sem juros)',
    cet: '0% a.a.'
  };
}

router.post('/pagar', autenticar, (req, res) => {
  const { agendamento_id, valor, forma_pagamento } = req.body;
  const r = db.prepare("INSERT INTO pagamentos (usuario_id, agendamento_id, tipo, valor, forma_pagamento, status) VALUES (?, ?, 'consulta', ?, ?, 'aprovado')").run(req.usuario.id, agendamento_id, valor, forma_pagamento);
  db.prepare("UPDATE agendamentos SET pago = 1, status = 'confirmado' WHERE id = ?").run(agendamento_id);
  res.json({ mensagem: 'Pago!', id: r.lastInsertRowid });
});

router.get('/meus-pagamentos', autenticar, (req, res) => {
  res.json(db.prepare('SELECT * FROM pagamentos WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 50').all(req.usuario.id));
});

router.post('/nota-fiscal', autenticar, (req, res) => {
  const { pagamento_id, autorizar } = req.body;
  const pag = db.prepare('SELECT * FROM pagamentos WHERE id = ?').get(pagamento_id);
  if (pag.tipo === 'produto') {
    const nf = db.prepare("INSERT INTO notas_fiscais (usuario_id, pagamento_id, tipo, valor_total, status) VALUES (?, ?, 'nfse', ?, 'emitida')").run(req.usuario.id, pagamento_id, pag.valor);
    return res.json({ mensagem: 'NF automática!', id: nf.lastInsertRowid });
  }
  if (!autorizar) return res.json({ mensagem: 'Aguardando autorização', precisa_autorizacao: true });
  const nf = db.prepare("INSERT INTO notas_fiscais (usuario_id, pagamento_id, tipo, valor_total, status, autorizada_por, data_autorizacao) VALUES (?, ?, 'nfse', ?, 'emitida', ?, datetime('now','localtime'))").run(req.usuario.id, pagamento_id, pag.valor, req.usuario.id);
  res.json({ mensagem: 'NF emitida!', id: nf.lastInsertRowid });
});

router.post('/renovar-assinatura', autenticar, (req, res) => {
  const { codigo_cupom, parcelas } = req.body;
  let desc = 0;
  let vitalicio = false;
  if (codigo_cupom === 'PRESENTEDOMAU') { desc = 100; vitalicio = true; }
  const valorBase = 549.00;
  const valor = vitalicio ? 0 : valorBase;
  const numParcelas = Math.min(Math.max(parseInt(parcelas) || 1, 1), 4);
  const valorParcela = valor / numParcelas;
  const exp = vitalicio ? '2099-12-31' : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
  const r = db.prepare("INSERT INTO assinaturas (usuario_id, plano, tipo_ciclo, valor, data_inicio, data_expiracao, parcelas, status) VALUES (?, 'pro', 'anual', ?, date('now'), ?, ?, 'ativa')").run(req.usuario.id, valor, exp, numParcelas);
  res.json({
    mensagem: 'Assinatura ativada!',
    vitalicio,
    id: r.lastInsertRowid,
    parcelamento: { parcelas: numParcelas, valorParcela: parseFloat(valorParcela.toFixed(2)), valorTotal: valor }
  });
});

router.get('/simular-parcelas', (req, res) => {
  const valores = { pro: 549.00, premium: 1649.00, enterprise: 3849.00 };
  const plano = req.query.plano;
  const parcelas = Math.min(Math.max(parseInt(req.query.parcelas) || 1, 1), 4);
  const valorTotal = valores[plano];
  if (!valorTotal) return res.status(400).json({ erro: 'Plano inválido' });
  res.json(calcularParcelas(valorTotal, parcelas));
});

router.get('/dashboard', autenticar, (req, res) => {
  const fat = db.prepare("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status = 'aprovado'").get();
  res.json({ faturamento: fat.t });
});

module.exports = router;