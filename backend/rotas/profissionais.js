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

router.get('/buscar', async (req, res) => {
  try {
    const { especialidade, modalidade, cep, paciente_id } = req.query;
    let q = "SELECT u.id, u.nome, u.registro_profissional, u.cidade, u.estado, u.atende_online, u.atende_presencial, u.especialidades, u.dominio, u.email FROM usuarios u WHERE u.ativo = 1 AND u.tipo IN ('profissional','admin')";
    const params = [];
    let paramCount = 0;

    // Filtro por especialidade
    if (especialidade) {
      paramCount++; q += ` AND u.especialidades LIKE $${paramCount}`; params.push('%' + especialidade + '%');
    }

    // Filtro por modalidade
    if (modalidade === 'online') q += ' AND u.atende_online = 1';
    else if (modalidade === 'presencial') { q += ' AND u.atende_presencial = 1'; }

    q += ' LIMIT 50';

    const result = await db.query(q, params);
    let profissionais = result.rows;

    // Buscar valores de cada profissional
    profissionais = await Promise.all(profissionais.map(async (prof) => {
      const vals = await db.query('SELECT pv.*, e.nome as espec_nome FROM profissional_valores pv JOIN especialidades e ON pv.especialidade_id = e.id WHERE pv.usuario_id = $1', [prof.id]);
      return { ...prof, especialidades_lista: prof.especialidades ? JSON.parse(prof.especialidades) : [], valores: vals.rows };
    }));

    // Se o paciente está logado, ordenar por distância + especialidades do paciente
    if (paciente_id) {
      try {
        const pac = await db.query('SELECT cep, cidade, estado, especialidades_atendidas FROM usuarios WHERE id = $1', [paciente_id]);
        if (pac.rows.length > 0 && pac.rows[0].cep) {
          const pacienteCEP = pac.rows[0].cep.replace(/\D/g, '');
          const especialidadesPaciente = pac.rows[0].especialidades_atendidas ? JSON.parse(pac.rows[0].especialidades_atendidas) : [];

          // Ordenar: especialidades do paciente primeiro, depois por distância
          profissionais.sort((a, b) => {
            const aEspecMatch = a.especialidades_lista.some(e => especialidadesPaciente.includes(e));
            const bEspecMatch = b.especialidades_lista.some(e => especialidadesPaciente.includes(e));
            if (aEspecMatch && !bEspecMatch) return -1;
            if (!aEspecMatch && bEspecMatch) return 1;
            return 0;
          });
        }
      } catch (e) { /* silencioso */ }
    }

    res.json(profissionais);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar profissionais' });
  }
});

router.post('/valores', autenticar, async (req, res) => {
  const { especialidade_id, valor_online, valor_presencial } = req.body;
  const ex = await db.query('SELECT id FROM profissional_valores WHERE usuario_id = $1 AND especialidade_id = $2', [req.usuario.id, especialidade_id]);
  if (ex.rows.length > 0) {
    await db.query('UPDATE profissional_valores SET valor_online=$1, valor_presencial=$2 WHERE id=$3', [valor_online, valor_presencial, ex.rows[0].id]);
  } else {
    await db.query('INSERT INTO profissional_valores (usuario_id, especialidade_id, valor_online, valor_presencial) VALUES ($1,$2,$3,$4)', [req.usuario.id, especialidade_id, valor_online, valor_presencial]);
  }
  res.json({ mensagem: 'Valores salvos!' });
});

module.exports = router;