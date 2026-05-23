const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticarCriador(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    const u = db.query('SELECT email, tipo FROM usuarios WHERE id = $1', [d.id]);
    if (u.rows[0]?.email !== 'admin@integra.com') return res.status(403).json({ erro: 'Exclusivo do criador' });
    req.criador = d;
    next();
  } catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.get('/dashboard', autenticarCriador, async (req, res) => {
  const ter = await db.query("SELECT COUNT(*) as t FROM usuarios WHERE tipo IN ('profissional','admin')");
  const pac = await db.query("SELECT COUNT(*) as t FROM usuarios WHERE tipo = 'paciente'");
  const ass = await db.query("SELECT COUNT(*) as t FROM assinaturas WHERE status = 'ativa'");
  const fat = await db.query("SELECT COALESCE(SUM(valor),0) as t FROM pagamentos WHERE status = 'aprovado'");
  const cupom = await db.query("SELECT COUNT(*) as t FROM assinaturas WHERE valor = 0 AND status = 'ativa'");
  const vendas = await db.query("SELECT p.*, u.nome FROM pagamentos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.status = 'aprovado' AND p.valor > 0 ORDER BY p.criado_em DESC LIMIT 10");
  
  res.json({
    metricas: { profissionais: ter.rows[0].t, pacientes: pac.rows[0].t, assinaturas: ass.rows[0].t },
    financeiro: { faturamento: fat.rows[0].t },
    cupons: { presentes_domau: cupom.rows[0].t },
    ultimas_vendas: vendas.rows
  });
});

router.get('/vendas', autenticarCriador, async (req, res) => {
  const { inicio, fim } = req.query;
  let q = "SELECT p.*, u.nome FROM pagamentos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.status = 'aprovado' AND p.valor > 0";
  const params = [];
  if (inicio) { params.push(inicio); q += ` AND p.criado_em >= $${params.length}`; }
  if (fim) { params.push(fim); q += ` AND p.criado_em <= $${params.length}`; }
  q += ' ORDER BY p.criado_em DESC LIMIT 100';
  const r = await db.query(q, params);
  res.json(r.rows);
});

router.post('/convidar', autenticarCriador, async (req, res) => {
  const { email, nome, plano, especialidades, desconto, meses_gratis } = req.body;
  // Gera um token de convite e envia por email (aqui simplificado)
  res.json({ mensagem: `Convite enviado para ${email}!`, plano, desconto });
});

router.get('/exportar-vendas', autenticarCriador, async (req, res) => {
  const r = await db.query("SELECT p.*, u.nome FROM pagamentos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.status = 'aprovado' AND p.valor > 0 ORDER BY p.criado_em DESC");
  let csv = 'ID,Tipo,Valor,Data,Cliente\n';
  r.rows.forEach(v => { csv += `${v.id},"${v.tipo}",${v.valor},"${v.criado_em}","${v.nome}"\n`; });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=vendas_integrativo.csv');
  res.send(csv);
});

module.exports = router;