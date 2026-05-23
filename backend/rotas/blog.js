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

router.get('/', async (req, res) => {
  const r = await db.query("SELECT a.*, u.nome as autor FROM artigos_blog a JOIN usuarios u ON a.usuario_id = u.id WHERE a.publicado = 1 ORDER BY a.criado_em DESC LIMIT 50");
  res.json(r.rows);
});

router.get('/meus', autenticar, async (req, res) => {
  const r = await db.query('SELECT * FROM artigos_blog WHERE usuario_id = $1 ORDER BY criado_em DESC', [req.usuario.id]);
  res.json(r.rows);
});

router.post('/', autenticar, async (req, res) => {
  const { titulo, conteudo, imagem_url, publicado } = req.body;
  const r = await db.query('INSERT INTO artigos_blog (usuario_id, titulo, conteudo, imagem_url, publicado) VALUES ($1,$2,$3,$4,$5) RETURNING id', [req.usuario.id, titulo, conteudo, imagem_url, publicado || 0]);
  res.status(201).json({ mensagem: 'Artigo criado!', id: r.rows[0].id });
});

router.put('/:id', autenticar, async (req, res) => {
  const { titulo, conteudo, imagem_url, publicado } = req.body;
  await db.query('UPDATE artigos_blog SET titulo=$1, conteudo=$2, imagem_url=$3, publicado=$4 WHERE id=$5 AND usuario_id=$6', [titulo, conteudo, imagem_url, publicado, req.params.id, req.usuario.id]);
  res.json({ mensagem: 'Artigo atualizado!' });
});

router.delete('/:id', autenticar, async (req, res) => {
  await db.query('DELETE FROM artigos_blog WHERE id=$1 AND usuario_id=$2', [req.params.id, req.usuario.id]);
  res.json({ mensagem: 'Artigo removido!' });
});

module.exports = router;