const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, tipo, especialidades, atende_online, atende_presencial, lgpd_consentimento } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
    if (existe) return res.status(400).json({ erro: 'Email já cadastrado' });
    const hash = await bcrypt.hash(senha, 12);
    const r = db.prepare("INSERT INTO usuarios (nome, email, senha, tipo, especialidades, atende_online, atende_presencial, lgpd_consentimento, lgpd_data_consentimento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))").run(nome, email, hash, tipo || 'paciente', especialidades || null, atende_online || 0, atende_presencial || 0, lgpd_consentimento || 0);
    if (tipo === 'paciente' || !tipo) db.prepare('INSERT INTO pacientes (usuario_id) VALUES (?)').run(r.lastInsertRowid);
    const token = jwt.sign({ id: r.lastInsertRowid, email, tipo: tipo || 'paciente' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ mensagem: 'Cadastro realizado!', token, usuario: { id: r.lastInsertRowid, nome, email } });
  } catch (e) { res.status(500).json({ erro: 'Erro interno' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha obrigatórios' });
    const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    if (!u) return res.status(401).json({ erro: 'Email ou senha incorretos' });
    if (!u.ativo) return res.status(403).json({ erro: 'Conta desativada' });
    const ok = await bcrypt.compare(senha, u.senha);
    if (!ok) return res.status(401).json({ erro: 'Email ou senha incorretos' });
    const token = jwt.sign({ id: u.id, email: u.email, tipo: u.tipo }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ mensagem: 'Login realizado!', token, usuario: { id: u.id, nome: u.nome, email: u.email, tipo: u.tipo, plano: u.plano } });
  } catch (e) { res.status(500).json({ erro: 'Erro interno' }); }
});

router.get('/verificar', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    const u = db.prepare('SELECT id, nome, email, tipo, plano FROM usuarios WHERE id = ?').get(d.id);
    res.json({ valido: true, usuario: u });
  } catch { res.status(401).json({ erro: 'Token inválido' }); }
});

module.exports = router;