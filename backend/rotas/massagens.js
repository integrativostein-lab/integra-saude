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

// Criar plano de massagem
router.post('/planos', autenticar, (req, res) => {
  const { nome_plano, sessoes_por_mes, valor_online, valor_presencial } = req.body;
  const r = db.prepare('INSERT INTO massagem_planos (usuario_id, nome_plano, sessoes_por_mes, valor_online, valor_presencial) VALUES (?, ?, ?, ?, ?)').run(req.usuario.id, nome_plano, sessoes_por_mes, valor_online, valor_presencial);
  res.status(201).json({ mensagem: 'Plano criado!', id: r.lastInsertRowid });
});

// Listar planos
router.get('/planos', (req, res) => {
  res.json(db.prepare('SELECT * FROM massagem_planos WHERE ativo = 1').all());
});

// Assinar plano
router.post('/assinar', autenticar, (req, res) => {
  const { plano_id, modalidade, tipo_pagamento, parcelas } = req.body;
  const plano = db.prepare('SELECT * FROM massagem_planos WHERE id = ?').get(plano_id);
  if (!plano) return res.status(404).json({ erro: 'Plano não encontrado' });
  const valor = modalidade === 'online' ? plano.valor_online : plano.valor_presencial;
  const exp = new Date(); exp.setMonth(exp.getMonth() + 1);
  const r = db.prepare("INSERT INTO massagem_assinaturas (paciente_id, plano_id, data_inicio, data_expiracao, sessoes_restantes, valor_total, tipo_pagamento, parcelas) VALUES (?, ?, date('now'), ?, ?, ?, ?, ?)").run(req.usuario.id, plano_id, exp.toISOString().split('T')[0], plano.sessoes_por_mes, valor, tipo_pagamento || 'a_vista', parcelas || 1);
  res.status(201).json({ mensagem: 'Assinatura realizada!', id: r.lastInsertRowid });
});

// Minhas assinaturas (paciente)
router.get('/minhas-assinaturas', autenticar, (req, res) => {
  res.json(db.prepare("SELECT ma.*, mp.nome_plano FROM massagem_assinaturas ma JOIN massagem_planos mp ON ma.plano_id = mp.id WHERE ma.paciente_id = ? AND ma.status = 'ativa'").all(req.usuario.id));
});

// Check-in
router.post('/checkin', autenticar, (req, res) => {
  const { agendamento_id } = req.body;
  db.prepare("UPDATE agendamentos SET status = 'em_andamento', checkin_metodo = 'manual', checkin_horario = datetime('now','localtime') WHERE id = ?").run(agendamento_id);
  res.json({ mensagem: 'Check-in realizado!' });
});

// Relatório de presença
router.get('/relatorio', autenticar, (req, res) => {
  const { inicio, fim } = req.query;
  let q = "SELECT a.*, u.nome as paciente_nome FROM agendamentos a JOIN usuarios u ON a.paciente_id = u.id WHERE a.profissional_id = ?";
  const p = [req.usuario.id];
  if (inicio) { q += ' AND a.data_agendamento >= ?'; p.push(inicio); }
  if (fim) { q += ' AND a.data_agendamento <= ?'; p.push(fim); }
  res.json(db.prepare(q + ' ORDER BY a.data_agendamento DESC').all(...p));
});

module.exports = router;