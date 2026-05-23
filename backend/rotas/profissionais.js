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

router.post('/', autenticar, async (req, res) => {
  const { profissional_id, data_agendamento, horario_inicio, modalidade } = req.body;
  const v = await db.query('SELECT valor_online, valor_presencial, duracao_minutos FROM profissional_valores WHERE usuario_id = $1 LIMIT 1', [profissional_id]);
  if (v.rows.length === 0) return res.status(400).json({ erro: 'Profissional sem valores' });
  
  const valor = modalidade === 'online' ? v.rows[0].valor_online : v.rows[0].valor_presencial;
  const duracao = v.rows[0].duracao_minutos || 60;
  const [h, m] = horario_inicio.split(':').map(Number);
  const totalMin = h * 60 + m + duracao;
  const fim = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;

  const r = await db.query(
    'INSERT INTO agendamentos (paciente_id, profissional_id, data_agendamento, horario_inicio, horario_fim, modalidade, valor) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [req.usuario.id, profissional_id, data_agendamento, horario_inicio, fim, modalidade, valor]
  );
  res.status(201).json({ mensagem: 'Agendado!', id: r.rows[0].id });
});

router.get('/meus', autenticar, async (req, res) => {
  const q = req.usuario.tipo === 'paciente' ? 'a.paciente_id = $1' : 'a.profissional_id = $1';
  const r = await db.query(`SELECT a.*, u.nome as profissional_nome FROM agendamentos a JOIN usuarios u ON a.profissional_id = u.id WHERE ${q} ORDER BY a.data_agendamento DESC LIMIT 50`, [req.usuario.id]);
  res.json(r.rows);
});

router.put('/:id/cancelar', autenticar, async (req, res) => {
  await db.query("UPDATE agendamentos SET status = 'cancelado', data_cancelamento = NOW() WHERE id = $1", [req.params.id]);
  res.json({ mensagem: 'Cancelado!' });
});

router.put('/:id/remarcar', autenticar, async (req, res) => {
  const { data_agendamento, horario_inicio } = req.body;
  if (!data_agendamento || !horario_inicio) return res.status(400).json({ erro: 'Data e horário obrigatórios' });
  await db.query("UPDATE agendamentos SET data_agendamento = $1, horario_inicio = $2, status = 'reagendado' WHERE id = $3 AND paciente_id = $4", [data_agendamento, horario_inicio, req.params.id, req.usuario.id]);
  res.json({ mensagem: 'Agendamento remarcado!' });
});

module.exports = router;