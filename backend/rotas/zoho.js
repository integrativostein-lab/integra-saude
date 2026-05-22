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

router.post('/criar-email', autenticar, (req, res) => {
  const { dominio, email } = req.body;
  db.prepare("INSERT INTO configuracoes (chave, valor, usuario_id) VALUES (?, ?, ?)").run('zoho_email_' + Date.now(), JSON.stringify({ dominio, email }), req.usuario.id);
  res.json({ mensagem: `Email ${email}@${dominio} seria criado (modo teste)`, simulacao: true });
});

module.exports = router;