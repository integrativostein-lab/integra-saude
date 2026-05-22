const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

router.get('/perfil', autenticar, (req, res) => {
  const u = db.prepare('SELECT id, nome, email, telefone, cpf, tipo, registro_profissional, conselho_classe, uf_conselho, registro_abrath, cnpj, cidade, estado, especialidades, atende_online, atende_presencial, plano, certificado_digital_senha FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!u) return res.status(404).json({ erro: 'Não encontrado' });
  if (u.tipo === 'paciente') u.dados_saude = db.prepare('SELECT * FROM pacientes WHERE usuario_id = ?').get(req.usuario.id);
  res.json(u);
});

router.put('/perfil', autenticar, (req, res) => {
  const campos = ['nome', 'telefone', 'registro_profissional', 'conselho_classe', 'uf_conselho', 'registro_abrath', 'cnpj', 'cidade', 'estado', 'especialidades', 'atende_online', 'atende_presencial', 'certificado_digital_senha'];
  const att = {};
  campos.forEach(c => { if (req.body[c] !== undefined) att[c] = req.body[c]; });
  if (Object.keys(att).length === 0) return res.status(400).json({ erro: 'Nada para atualizar' });
  const sets = Object.keys(att).map(k => `${k} = ?`).join(', ');
  const vals = Object.values(att);
  vals.push(req.usuario.id);
  db.prepare(`UPDATE usuarios SET ${sets}, atualizado_em = datetime('now','localtime') WHERE id = ?`).run(...vals);
  res.json({ mensagem: 'Perfil atualizado!' });
});

router.put('/configurar-loja', autenticar, (req, res) => {
  const { loja_ativa, nome_loja } = req.body;
  const config = JSON.stringify({ loja_ativa: loja_ativa !== false, nome_loja: nome_loja || 'Minha Loja' });
  const ex = db.prepare("SELECT id FROM configuracoes WHERE chave = 'loja_config' AND usuario_id = ?").get(req.usuario.id);
  if (ex) db.prepare('UPDATE configuracoes SET valor = ? WHERE id = ?').run(config, ex.id);
  else db.prepare('INSERT INTO configuracoes (chave, valor, usuario_id) VALUES (?, ?, ?)').run('loja_config', config, req.usuario.id);
  res.json({ mensagem: 'Loja configurada!' });
});

router.get('/status-loja', autenticar, (req, res) => {
  const c = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'loja_config' AND usuario_id = ?").get(req.usuario.id);
  res.json(c ? JSON.parse(c.valor) : { loja_ativa: false });
});

module.exports = router;