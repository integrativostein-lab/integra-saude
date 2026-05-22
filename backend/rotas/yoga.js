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

router.post('/planos', autenticar, (req, res) => {
  const { nome_plano, aulas_por_mes, valor_online, valor_presencial } = req.body;
  const r = db.prepare('INSERT INTO yoga_planos (usuario_id, nome_plano, aulas_por_mes, valor_online, valor_presencial) VALUES (?, ?, ?, ?, ?)').run(req.usuario.id, nome_plano, aulas_por_mes, valor_online, valor_presencial);
  res.status(201).json({ mensagem: 'Plano criado!', id: r.lastInsertRowid });
});

router.get('/planos', (req, res) => {
  res.json(db.prepare('SELECT * FROM yoga_planos WHERE ativo = 1').all());
});

router.post('/assinar', autenticar, (req, res) => {
  const { plano_id, modalidade } = req.body;
  const plano = db.prepare('SELECT * FROM yoga_planos WHERE id = ?').get(plano_id);
  if (!plano) return res.status(404).json({ erro: 'Plano não encontrado' });
  const valor = modalidade === 'online' ? plano.valor_online : plano.valor_presencial;
  const exp = new Date(); exp.setMonth(exp.getMonth() + 1);
  const r = db.prepare("INSERT INTO yoga_assinaturas (paciente_id, plano_id, data_inicio, data_expiracao, aulas_restantes, valor_mensalidade) VALUES (?, ?, date('now'), ?, ?, ?)").run(req.usuario.id, plano_id, exp.toISOString().split('T')[0], plano.aulas_por_mes, valor);
  res.status(201).json({ mensagem: 'Assinatura realizada!', id: r.lastInsertRowid });
});

router.post('/checkin', autenticar, (req, res) => {
  const { agendamento_id } = req.body;
  db.prepare("UPDATE agendamentos SET status = 'em_andamento', checkin_metodo = 'manual', checkin_horario = datetime('now','localtime') WHERE id = ? AND paciente_id = ?").run(agendamento_id, req.usuario.id);
  res.json({ mensagem: 'Check-in realizado!' });
});

router.get('/minhas-reposicoes', autenticar, (req, res) => {
  const rep = db.prepare("SELECT r.*, a.data_agendamento FROM yoga_reposicoes r JOIN agendamentos a ON r.aula_faltada_id = a.id JOIN yoga_assinaturas ya ON r.assinatura_id = ya.id WHERE ya.paciente_id = ? AND r.status = 'pendente'").all(req.usuario.id);
  res.json(rep);
});

router.post('/presenca-video', autenticar, (req, res) => {
  const { agendamento_id } = req.body;
  const ag = db.prepare('SELECT * FROM agendamentos WHERE id = ? AND paciente_id = ? AND modalidade = ?').get(agendamento_id, req.usuario.id, 'online');
  if (!ag) return res.status(404).json({ erro: 'Agendamento não encontrado' });
  if (['em_andamento', 'realizado'].includes(ag.status)) return res.json({ mensagem: 'Presença já registrada' });
  db.prepare("UPDATE agendamentos SET status = 'em_andamento', checkin_metodo = 'auto_video', checkin_horario = datetime('now','localtime') WHERE id = ?").run(agendamento_id);
  res.json({ mensagem: 'Presença detectada automaticamente!' });
});

module.exports = router;