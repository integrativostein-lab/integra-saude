require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] }));
const limiter = rateLimit({ windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, max: parseInt(process.env.RATE_LIMIT_MAX) || 100, message: { erro: 'Muitas requisições.' } });
app.use('/api/', limiter);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

app.get('/', (req, res) => {
  res.json({ sistema: 'Integra - Saúde Integrativa', versao: '1.0.0', status: 'online' });
});

const authRoutes = require('./rotas/auth');
const usuarioRoutes = require('./rotas/usuarios');
const agendamentoRoutes = require('./rotas/agendamentos');
const profissionalRoutes = require('./rotas/profissionais');
const financeiroRoutes = require('./rotas/financeiro');
const lojaRoutes = require('./rotas/loja');
const yogaRoutes = require('./rotas/yoga');
const prescricaoRoutes = require('./rotas/prescricoes');
const adminRoutes = require('./rotas/admin');
const revendaRoutes = require('./rotas/revenda');
const criadorRoutes = require('./rotas/criador');
const zohoRoutes = require('./rotas/zoho');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/profissionais', profissionalRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/loja', lojaRoutes);
app.use('/api/yoga', yogaRoutes);
app.use('/api/prescricoes', prescricaoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/revenda', revendaRoutes);
app.use('/api/criador', criadorRoutes);
app.use('/api/zoho', zohoRoutes);

console.log('✅ Rotas carregadas');

app.use((err, req, res, next) => { res.status(500).json({ erro: 'Erro interno' }); });
app.use('*', (req, res) => { res.status(404).json({ erro: 'Rota não encontrada' }); });

app.listen(PORT, () => {
  console.log('🌿 INTEGRA - Rodando na porta ' + PORT);
  console.log('📧 Admin: admin@integra.com / admin123');
});

module.exports = app;