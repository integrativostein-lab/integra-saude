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

// Emitir guia (DAS, GPS, FGTS, etc.)
router.post('/emitir-guia', autenticar, (req, res) => {
  const { tipo, valor, data_vencimento } = req.body;
  if (!['DAS','GPS','FGTS','INSS_COMPLEMENTAR','ISS'].includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido' });
  const r = db.prepare('INSERT INTO guias_emitidas (empresa_id, tipo, valor, data_vencimento) VALUES (?, ?, ?, ?)').run(req.usuario.id, tipo, valor, data_vencimento);
  res.status(201).json({ mensagem: 'Guia emitida!', id: r.lastInsertRowid, tipo, valor });
});

// Listar guias
router.get('/guias', autenticar, (req, res) => {
  res.json(db.prepare('SELECT * FROM guias_emitidas WHERE empresa_id = ? ORDER BY data_vencimento DESC').all(req.usuario.id));
});

// Calcular DAS-MEI
router.get('/calcular-das', autenticar, (req, res) => {
  const fat = db.prepare("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE usuario_id = ? AND status = 'aprovado' AND criado_em >= date('now','start of month')").get(req.usuario.id);
  const dasMEI = 75.00;
  res.json({ das_mei: dasMEI, faturamento_mes: fat.t, vencimento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 20).toISOString().split('T')[0] });
});

// Alerta de limite MEI
router.get('/alerta-limite-mei', autenticar, (req, res) => {
  const fatAno = db.prepare("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE usuario_id = ? AND status = 'aprovado' AND criado_em >= date('now','start of year')").get(req.usuario.id);
  const limite = 81000;
  const percentual = ((fatAno.t / limite) * 100).toFixed(1);
  res.json({ faturamento_ano: fatAno.t, limite, percentual, alerta: percentual >= 80 });
});

// Resumo fiscal mensal
router.get('/resumo-mensal', autenticar, (req, res) => {
  const mes = new Date().toISOString().substring(0, 7);
  const guias = db.prepare("SELECT tipo, SUM(valor) as total FROM guias_emitidas WHERE empresa_id = ? AND data_vencimento LIKE ? GROUP BY tipo").all(req.usuario.id, mes + '%');
  const folha = db.prepare("SELECT SUM(salario_bruto) as total FROM folha_pagamento fp JOIN funcionarios f ON fp.funcionario_id = f.id WHERE f.empresa_id = ? AND fp.mes_referencia = ?").get(req.usuario.id, mes);
  res.json({ mes, guias, total_folha: folha?.total || 0 });
});

module.exports = router;