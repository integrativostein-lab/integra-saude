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
  const { paciente_id, itens, observacoes } = req.body;
  const prof = db.prepare('SELECT conselho_classe FROM usuarios WHERE id = ?').get(req.usuario.id);
  const tipo = prof?.conselho_classe ? 'prescricao' : 'solicitacao';
  const r = db.prepare('INSERT INTO prescricoes (paciente_id, profissional_id, tipo, itens, observacoes) VALUES (?, ?, ?, ?, ?)').run(paciente_id, req.usuario.id, tipo, JSON.stringify(itens), observacoes);
  res.status(201).json({ mensagem: `${tipo} registrada!`, tipo, id: r.lastInsertRowid });
});

router.get('/minhas', autenticar, (req, res) => {
  res.json(db.prepare('SELECT * FROM prescricoes WHERE paciente_id = ? ORDER BY data_prescricao DESC').all(req.usuario.id));
});

module.exports = router;