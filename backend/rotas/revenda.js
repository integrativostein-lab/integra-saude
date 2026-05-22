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

router.get('/catalogo', autenticar, (req, res) => {
  res.json({
    certificados: [
      { tipo: 'A1', nome: 'Certificado A1 - 1 ano', preco: 260.00 },
      { tipo: 'A3', nome: 'Certificado A3 - 3 anos', preco: 585.00 }
    ],
    dominios: [
      { extensao: '.com.br', nome: 'Domínio .com.br', preco: 52.00 },
      { extensao: '.com', nome: 'Domínio .com', preco: 78.00 }
    ]
  });
});

router.post('/comprar-certificado', autenticar, (req, res) => {
  const { tipo } = req.body;
  const precos = { A1: { custo: 200, preco: 260 }, A3: { custo: 450, preco: 585 } };
  const p = precos[tipo];
  if (!p) return res.status(400).json({ erro: 'Tipo inválido' });
  const exp = new Date(); exp.setFullYear(exp.getFullYear() + (tipo === 'A1' ? 1 : 3));
  const r = db.prepare('INSERT INTO revenda_certificados (tipo, custo_aquisicao, preco_venda, data_validade) VALUES (?, ?, ?, ?)').run(tipo, p.custo, p.preco, exp.toISOString().split('T')[0]);
  db.prepare("INSERT INTO pagamentos (usuario_id, tipo, valor, status) VALUES (?, 'revenda_certificado', ?, 'aprovado')").run(req.usuario.id, p.preco);
  res.status(201).json({ mensagem: 'Certificado comprado!', id: r.lastInsertRowid, valor: p.preco });
});

router.post('/comprar-dominio', autenticar, (req, res) => {
  const { dominio, extensao } = req.body;
  const precos = { '.com.br': { custo: 40, preco: 52 }, '.com': { custo: 60, preco: 78 } };
  const p = precos[extensao];
  if (!p) return res.status(400).json({ erro: 'Extensão inválida' });
  const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
  const r = db.prepare('INSERT INTO revenda_dominios (dominio, extensao, custo_aquisicao, preco_venda, data_expiracao) VALUES (?, ?, ?, ?, ?)').run(dominio, extensao, p.custo, p.preco, exp.toISOString().split('T')[0]);
  db.prepare("INSERT INTO pagamentos (usuario_id, tipo, valor, status) VALUES (?, 'revenda_dominio', ?, 'aprovado')").run(req.usuario.id, p.preco);
  res.status(201).json({ mensagem: 'Domínio comprado!', id: r.lastInsertRowid, valor: p.preco });
});

module.exports = router; 