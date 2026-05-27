const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const axios = require('axios');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

// BUSCAR PROFISSIONAIS
router.get('/buscar', async (req, res) => {
  try {
    const { especialidade, modalidade, cep } = req.query;
    let q = "SELECT u.id, u.nome, u.registro_profissional, u.cidade, u.estado, u.atende_online, u.atende_presencial, u.especialidades FROM usuarios u WHERE u.ativo = 1 AND u.tipo IN ('profissional','admin')";
    const params = [];
    let i = 1;

    if (especialidade) { q += ` AND u.especialidades LIKE $${i}`; params.push('%' + especialidade + '%'); i++; }
    if (modalidade === 'online') q += ' AND u.atende_online = 1';
    else if (modalidade === 'presencial') { q += ' AND u.atende_presencial = 1'; }
    q += ' LIMIT 50';

    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar profissionais' });
  }
});

// CONFIGURAR VALORES
router.post('/valores', autenticar, async (req, res) => {
  const { especialidade_id, valor_online, valor_presencial } = req.body;
  try {
    const ex = await db.query('SELECT id FROM profissional_valores WHERE usuario_id = $1 AND especialidade_id = $2', [req.usuario.id, especialidade_id]);
    if (ex.rows.length > 0) {
      await db.query('UPDATE profissional_valores SET valor_online=$1, valor_presencial=$2 WHERE id=$3', [valor_online, valor_presencial, ex.rows[0].id]);
    } else {
      await db.query('INSERT INTO profissional_valores (usuario_id, especialidade_id, valor_online, valor_presencial) VALUES ($1,$2,$3,$4)', [req.usuario.id, especialidade_id, valor_online, valor_presencial]);
    }
    res.json({ mensagem: 'Valores salvos!' });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao salvar valores' });
  }
});

module.exports = router;