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

router.get('/buscar', (req, res) => {
  let q = "SELECT u.id, u.nome, u.registro_profissional, u.cidade, u.estado, u.atende_online, u.atende_presencial, u.especialidades FROM usuarios u WHERE u.ativo = 1 AND u.tipo IN ('terapeuta','admin')";
  const p = [];
  const { especialidade, modalidade } = req.query;
  if (especialidade) { q += ' AND u.especialidades LIKE ?'; p.push('%' + especialidade + '%'); }
  if (modalidade === 'online') q += ' AND u.atende_online = 1';
  else if (modalidade === 'presencial') q += ' AND u.atende_presencial = 1';
  const profs = db.prepare(q + ' LIMIT 50').all(...p);
  const resu = profs.map(prof => {
    const vals = db.prepare('SELECT pv.*, e.nome as espec_nome FROM profissional_valores pv JOIN especialidades e ON pv.especialidade_id = e.id WHERE pv.usuario_id = ?').all(prof.id);
    return { ...prof, especialidades_lista: prof.especialidades ? JSON.parse(prof.especialidades) : [], valores: vals };
  });
  res.json(resu);
});

router.post('/valores', autenticar, (req, res) => {
  const { especialidade_id, valor_online, valor_presencial } = req.body;
  const ex = db.prepare('SELECT id FROM profissional_valores WHERE usuario_id = ? AND especialidade_id = ?').get(req.usuario.id, especialidade_id);
  if (ex) db.prepare('UPDATE profissional_valores SET valor_online=?, valor_presencial=? WHERE id=?').run(valor_online, valor_presencial, ex.id);
  else db.prepare('INSERT INTO profissional_valores (usuario_id, especialidade_id, valor_online, valor_presencial) VALUES (?,?,?,?)').run(req.usuario.id, especialidade_id, valor_online, valor_presencial);
  res.json({ mensagem: 'Valores salvos!' });
});

module.exports = router;