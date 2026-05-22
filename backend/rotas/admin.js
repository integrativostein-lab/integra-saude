const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticarAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    const u = db.prepare('SELECT tipo FROM usuarios WHERE id = ?').get(d.id);
    if (!['admin', 'super_admin'].includes(u?.tipo)) return res.status(403).json({ erro: 'Acesso restrito' });
    req.usuario = d;
    next();
  } catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.get('/dashboard', autenticarAdmin, (req, res) => {
  const pac = db.prepare("SELECT COUNT(*) as t FROM usuarios WHERE tipo = 'paciente'").get();
  const ter = db.prepare("SELECT COUNT(*) as t FROM usuarios WHERE tipo IN ('terapeuta','admin')").get();
  const fat = db.prepare("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status = 'aprovado'").get();
  res.json({ pacientes: pac.t, terapeutas: ter.t, faturamento_total: fat.t });
});

router.get('/usuarios', autenticarAdmin, (req, res) => {
  res.json(db.prepare('SELECT id, nome, email, tipo, plano, ativo FROM usuarios LIMIT 100').all());
});

module.exports = router;