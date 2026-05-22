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

router.post('/', autenticar, (req, res) => {
  const { profissional_id, data_agendamento, horario_inicio, modalidade } = req.body;
  const v = db.prepare('SELECT valor_online, valor_presencial, duracao_minutos FROM profissional_valores WHERE usuario_id = ?').get(profissional_id);
  if (!v) return res.status(400).json({ erro: 'Profissional sem valores' });
  const valor = modalidade === 'online' ? v.valor_online : v.valor_presencial;
  const [h, m] = horario_inicio.split(':').map(Number);
  const fim = `${String(h + Math.floor((m + (v.duracao_minutos || 60)) / 60)).padStart(2,'0')}:${String((m + (v.duracao_minutos || 60)) % 60).padStart(2,'0')}`;
  const r = db.prepare('INSERT INTO agendamentos (paciente_id, profissional_id, data_agendamento, horario_inicio, horario_fim, modalidade, valor) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.usuario.id, profissional_id, data_agendamento, horario_inicio, fim, modalidade, valor);
  res.status(201).json({ mensagem: 'Agendado!', id: r.lastInsertRowid });
});

router.get('/meus', autenticar, (req, res) => {
  const q = req.usuario.tipo === 'paciente' ? 'a.paciente_id = ?' : 'a.profissional_id = ?';
  const ag = db.prepare(`SELECT a.*, u.nome as profissional_nome FROM agendamentos a JOIN usuarios u ON a.profissional_id = u.id WHERE ${q} ORDER BY a.data_agendamento DESC LIMIT 50`).all(req.usuario.id);
  res.json(ag);
});

router.put('/:id/cancelar', autenticar, (req, res) => {
  db.prepare("UPDATE agendamentos SET status = 'cancelado', data_cancelamento = datetime('now','localtime') WHERE id = ?").run(req.params.id);
  res.json({ mensagem: 'Cancelado!' });
});

router.put('/:id/remarcar', autenticar, (req, res) => {
  const { data_agendamento, horario_inicio } = req.body;
  if (!data_agendamento || !horario_inicio) return res.status(400).json({ erro: 'Data e horário obrigatórios' });
  db.prepare("UPDATE agendamentos SET data_agendamento = ?, horario_inicio = ?, status = 'reagendado', atualizado_em = datetime('now','localtime') WHERE id = ? AND paciente_id = ?").run(data_agendamento, horario_inicio, req.params.id, req.usuario.id);
  res.json({ mensagem: 'Agendamento remarcado!' });
});

module.exports = router;