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

// Cadastrar funcionário
router.post('/funcionarios', autenticar, (req, res) => {
  const { nome, cpf, pis, ctps, cargo, salario, data_admissao, anotacoes } = req.body;
  const r = db.prepare('INSERT INTO funcionarios (empresa_id, nome, cpf, pis, ctps, cargo, salario, data_admissao, anotacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(req.usuario.id, nome, cpf, pis, ctps, cargo, salario, data_admissao, anotacoes);
  res.status(201).json({ mensagem: 'Funcionário cadastrado!', id: r.lastInsertRowid });
});

// Listar funcionários
router.get('/funcionarios', autenticar, (req, res) => {
  res.json(db.prepare('SELECT * FROM funcionarios WHERE empresa_id = ? ORDER BY nome').all(req.usuario.id));
});

// Atualizar funcionário
router.put('/funcionarios/:id', autenticar, (req, res) => {
  const { nome, cargo, salario, anotacoes, status } = req.body;
  db.prepare('UPDATE funcionarios SET nome=?, cargo=?, salario=?, anotacoes=?, status=? WHERE id=? AND empresa_id=?').run(nome, cargo, salario, anotacoes, status, req.params.id, req.usuario.id);
  res.json({ mensagem: 'Atualizado!' });
});

// Gerar folha de pagamento
router.post('/folha', autenticar, (req, res) => {
  const { mes_referencia } = req.body;
  const funcs = db.prepare('SELECT * FROM funcionarios WHERE empresa_id = ? AND status = ?').all(req.usuario.id, 'ativo');
  let totalFolha = 0;
  const resultados = [];
  for (const f of funcs) {
    const inss = f.salario * 0.08;
    const irrf = f.salario > 1903.98 ? f.salario * 0.075 : 0;
    const fgts = f.salario * 0.08;
    const liquido = f.salario - inss - irrf;
    totalFolha += f.salario;
    const r = db.prepare('INSERT INTO folha_pagamento (funcionario_id, mes_referencia, salario_bruto, inss_descontado, irrf_descontado, fgts, salario_liquido) VALUES (?, ?, ?, ?, ?, ?, ?)').run(f.id, mes_referencia, f.salario, inss, irrf, fgts, liquido);
    resultados.push({ funcionario: f.nome, salario_bruto: f.salario, inss, irrf, fgts, liquido, id: r.lastInsertRowid });
  }
  res.json({ mes: mes_referencia, total_folha: totalFolha, funcionarios: resultados });
});

// Relatório de folha (contracheque)
router.get('/folha/:mes', autenticar, (req, res) => {
  const dados = db.prepare('SELECT fp.*, f.nome FROM folha_pagamento fp JOIN funcionarios f ON fp.funcionario_id = f.id WHERE f.empresa_id = ? AND fp.mes_referencia = ?').all(req.usuario.id, req.params.mes);
  res.json(dados);
});

// Configurar previdência do profissional
router.post('/config-previdencia', autenticar, (req, res) => {
  const { tipo_contribuicao, salarios_contribuicao } = req.body;
  const ex = db.prepare('SELECT id FROM config_previdencia WHERE usuario_id = ?').get(req.usuario.id);
  if (ex) db.prepare('UPDATE config_previdencia SET tipo_contribuicao=?, salarios_contribuicao=? WHERE id=?').run(tipo_contribuicao, salarios_contribuicao, ex.id);
  else db.prepare('INSERT INTO config_previdencia (usuario_id, tipo_contribuicao, salarios_contribuicao) VALUES (?, ?, ?)').run(req.usuario.id, tipo_contribuicao, salarios_contribuicao);
  res.json({ mensagem: 'Configuração salva!' });
});

// Calcular guia previdenciária do profissional
router.get('/guia-previdencia', autenticar, (req, res) => {
  const cfg = db.prepare('SELECT * FROM config_previdencia WHERE usuario_id = ?').get(req.usuario.id);
  const salMin = 1500.00;
  const base = cfg ? cfg.salarios_contribuicao * salMin : salMin;
  const aliquota = 0.20;
  const valorINSS = base * aliquota;
  const valorDAS = 75.00;
  const complemento = Math.max(0, valorINSS - valorDAS);
  res.json({ salario_minimo: salMin, salarios_contribuicao: cfg?.salarios_contribuicao || 1, valor_inss: valorINSS, das_mei: valorDAS, complemento });
});

module.exports = router;