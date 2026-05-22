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

router.get('/produtos', (req, res) => {
  res.json(db.prepare('SELECT * FROM produtos WHERE ativo = 1 LIMIT 100').all());
});

router.post('/produtos', autenticar, (req, res) => {
  const { nome, preco, estoque, categoria } = req.body;
  const r = db.prepare('INSERT INTO produtos (usuario_id, nome, preco, estoque, categoria) VALUES (?, ?, ?, ?, ?)').run(req.usuario.id, nome, preco, estoque || 0, categoria);
  res.status(201).json({ mensagem: 'Produto cadastrado!', id: r.lastInsertRowid });
});

router.post('/pedidos', autenticar, (req, res) => {
  const { itens, origem } = req.body;
  let total = 0;
  for (const item of itens) {
    const prod = db.prepare('SELECT * FROM produtos WHERE id = ?').get(item.produto_id);
    if (!prod) return res.status(404).json({ erro: 'Produto não encontrado' });
    total += prod.preco * item.quantidade;
  }
  const r = db.prepare("INSERT INTO pedidos_loja (paciente_id, vendedor_id, origem, valor_total, frete_valor) VALUES (?, ?, ?, ?, 0)").run(req.usuario.id, itens[0].usuario_id || 1, origem || 'virtual', total);
  res.status(201).json({ mensagem: 'Pedido criado!', id: r.lastInsertRowid, total });
});

module.exports = router;