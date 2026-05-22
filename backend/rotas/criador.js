const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticarCriador(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    const u = db.prepare('SELECT email, tipo FROM usuarios WHERE id = ?').get(d.id);
    if (u?.email !== 'admin@integra.com') return res.status(403).json({ erro: 'Exclusivo do criador' });
    req.criador = u;
    next();
  } catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.get('/dashboard', autenticarCriador, (req, res) => {
  const ter = db.prepare("SELECT COUNT(*) as t FROM usuarios WHERE tipo IN ('terapeuta','admin')").get();
  const pac = db.prepare("SELECT COUNT(*) as t FROM usuarios WHERE tipo = 'paciente'").get();
  const ass = db.prepare("SELECT COUNT(*) as t FROM assinaturas WHERE status = 'ativa'").get();
  const fat = db.prepare("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status = 'aprovado'").get();
  const cupom = db.prepare("SELECT COUNT(*) as t FROM assinaturas WHERE valor = 0 AND status = 'ativa'").get();
  res.json({ terapeutas: ter.t, pacientes: pac.t, assinaturas: ass.t, faturamento: fat.t, cupons_usados: cupom.t });
});

module.exports = router;