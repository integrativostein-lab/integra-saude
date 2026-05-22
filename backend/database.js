const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('📦 Banco de dados conectado!');

function criarTabelas() {
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      telefone TEXT,
      cpf TEXT UNIQUE,
      data_nascimento TEXT,
      sexo TEXT,
      tipo TEXT NOT NULL CHECK(tipo IN ('paciente','terapeuta','recepcionista','financeiro','admin','super_admin')),
      registro_profissional TEXT,
      conselho_classe TEXT,
      uf_conselho TEXT,
      registro_abrath TEXT,
      responsavel_tecnico TEXT,
      cnpj TEXT,
      inscricao_municipal TEXT,
      certificado_digital_senha TEXT,
      cep TEXT,
      logradouro TEXT,
      numero TEXT,
      complemento TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      especialidades TEXT,
      atende_online INTEGER DEFAULT 0,
      atende_presencial INTEGER DEFAULT 0,
      gateway_preferido TEXT CHECK(gateway_preferido IN ('pagseguro','pagbank')),
      gateway_token TEXT,
      gateway_email TEXT,
      evolution_instancia TEXT,
      evolution_token TEXT,
      plano TEXT DEFAULT 'freemium' CHECK(plano IN ('freemium','pro','premium','enterprise')),
      data_assinatura TEXT,
      data_expiracao_assinatura TEXT,
      assinatura_ativa INTEGER DEFAULT 0,
      aceita_cartao_credito INTEGER DEFAULT 1,
      aceita_cartao_debito INTEGER DEFAULT 1,
      aceita_pix INTEGER DEFAULT 1,
      aceita_dinheiro INTEGER DEFAULT 1,
      frete_gratis_valor_minimo REAL,
      tentativas_login INTEGER DEFAULT 0,
      bloqueado_ate TEXT,
      autenticacao_dois_fatores INTEGER DEFAULT 0,
      google_id TEXT,
      apple_id TEXT,
      lgpd_consentimento INTEGER DEFAULT 0,
      lgpd_data_consentimento TEXT,
      lgpd_ip_consentimento TEXT,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER UNIQUE,
      altura REAL,
      peso REAL,
      tipo_sanguineo TEXT,
      fumante INTEGER DEFAULT 0,
      bebidas TEXT,
      exercicios TEXT,
      sono TEXT,
      apetite TEXT,
      doencas_cronicas TEXT,
      cirurgias TEXT,
      medicamentos_uso TEXT,
      alergias TEXT,
      menstruacao TEXT,
      gravidez TEXT,
      observacoes TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS especialidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT UNIQUE NOT NULL,
      descricao TEXT,
      exige_presencial INTEGER DEFAULT 0,
      ativo INTEGER DEFAULT 1
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS profissional_valores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      especialidade_id INTEGER,
      valor_online REAL,
      valor_presencial REAL,
      duracao_minutos INTEGER DEFAULT 60,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER,
      profissional_id INTEGER,
      especialidade_id INTEGER,
      data_agendamento TEXT NOT NULL,
      horario_inicio TEXT NOT NULL,
      horario_fim TEXT NOT NULL,
      modalidade TEXT CHECK(modalidade IN ('online','presencial')),
      valor REAL,
      status TEXT DEFAULT 'agendado' CHECK(status IN ('agendado','confirmado','em_andamento','realizado','cancelado','falta','reagendado')),
      forma_pagamento TEXT,
      pago INTEGER DEFAULT 0,
      nota_fiscal_emitida INTEGER DEFAULT 0,
      nota_fiscal_numero TEXT,
      lembrete_enviado INTEGER DEFAULT 0,
      cancelado_por TEXT,
      motivo_cancelamento TEXT,
      data_cancelamento TEXT,
      reposicao_id INTEGER,
      checkin_metodo TEXT,
      checkin_horario TEXT,
      finalizado_em TEXT,
      sala_token TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
      FOREIGN KEY (profissional_id) REFERENCES usuarios(id),
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS profissional_regras_agendamento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER UNIQUE,
      antecedencia_minima_horas INTEGER DEFAULT 24,
      prazo_cancelamento_horas INTEGER DEFAULT 12,
      multa_falta_valor REAL,
      limite_reagendamentos_mes INTEGER DEFAULT 2,
      tolerancia_atraso_minutos INTEGER DEFAULT 10,
      bloqueio_apos_faltas INTEGER DEFAULT 3,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS profissional_horarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      dia_semana INTEGER CHECK(dia_semana BETWEEN 0 AND 6),
      horario_inicio TEXT,
      horario_fim TEXT,
      intervalo_minutos INTEGER DEFAULT 0,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS profissional_bloqueios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      data_inicio TEXT,
      data_fim TEXT,
      motivo TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS formularios_levantamento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER,
      profissional_id INTEGER,
      especialidade_id INTEGER,
      parte1_estado_atual TEXT,
      parte2_ficha_complementar TEXT,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','preenchido_paciente','completo')),
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
      FOREIGN KEY (profissional_id) REFERENCES usuarios(id),
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS modelos_ficha_complementar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      especialidade_id INTEGER,
      nome_modelo TEXT,
      campos TEXT,
      padrao INTEGER DEFAULT 0,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS prontuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER,
      profissional_id INTEGER,
      data_sessao TEXT,
      evolucao TEXT,
      anexos TEXT,
      notas_internas TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
      FOREIGN KEY (profissional_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS prescricoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER,
      profissional_id INTEGER,
      tipo TEXT CHECK(tipo IN ('prescricao','solicitacao')),
      itens TEXT,
      exames_sugeridos TEXT,
      observacoes TEXT,
      data_prescricao TEXT DEFAULT (datetime('now','localtime')),
      valida_ate TEXT,
      status TEXT DEFAULT 'ativa',
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
      FOREIGN KEY (profissional_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS banco_terapeutico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      especialidade_id INTEGER,
      tipo TEXT CHECK(tipo IN ('medicamento','tratamento','dieta','exame','erva','oleo','tecnica','asana','ritual')),
      nome TEXT NOT NULL,
      descricao TEXT,
      contraindicacoes TEXT,
      dosagem_padrao TEXT,
      ativo INTEGER DEFAULT 1,
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS assinaturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      plano TEXT,
      tipo_ciclo TEXT CHECK(tipo_ciclo IN ('mensal','anual')),
      valor REAL,
      data_inicio TEXT,
      data_expiracao TEXT,
      renovacao_automatica INTEGER DEFAULT 0,
      parcelas INTEGER DEFAULT 1,
      juros_mensal REAL DEFAULT 0,
      multa_cancelamento_percentual REAL DEFAULT 0,
      status TEXT DEFAULT 'ativa' CHECK(status IN ('ativa','cancelada','expirada','pendente','renovada')),
      contrato_pdf TEXT,
      data_aceite TEXT,
      ip_aceite TEXT,
      data_cancelamento TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pagamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      agendamento_id INTEGER,
      assinatura_id INTEGER,
      pedido_loja_id INTEGER,
      tipo TEXT CHECK(tipo IN ('consulta','assinatura','produto','aula_yoga','estorno','reembolso_arrependimento','revenda_certificado','revenda_dominio','mensalidade_yoga')),
      valor REAL,
      forma_pagamento TEXT CHECK(forma_pagamento IN ('pix','cartao_credito','cartao_debito','dinheiro','estorno_integral','pix_fora_sistema','transferencia','outro')),
      parcelas INTEGER DEFAULT 1,
      gateway TEXT,
      gateway_transaction_id TEXT,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','aprovado','recusado','estornado','cancelado')),
      comprovante_url TEXT,
      observacoes TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id),
      FOREIGN KEY (assinatura_id) REFERENCES assinaturas(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notas_fiscais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      pagamento_id INTEGER,
      tipo TEXT CHECK(tipo IN ('nfe','nfse')),
      numero TEXT,
      serie TEXT,
      chave_acesso TEXT,
      valor_total REAL,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','autorizada','emitida','cancelada','rejeitada')),
      autorizada_por INTEGER,
      data_autorizacao TEXT,
      xml_url TEXT,
      pdf_url TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (pagamento_id) REFERENCES pagamentos(id),
      FOREIGN KEY (autorizada_por) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      nome TEXT NOT NULL,
      descricao TEXT,
      preco REAL NOT NULL,
      estoque INTEGER DEFAULT 0,
      categoria TEXT,
      imagem_url TEXT,
      digital INTEGER DEFAULT 0,
      arquivo_digital_url TEXT,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos_loja (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER,
      vendedor_id INTEGER,
      origem TEXT CHECK(origem IN ('virtual','fisica')),
      valor_total REAL,
      frete_valor REAL,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','pago','enviado','entregue','cancelado')),
      endereco_entrega TEXT,
      forma_pagamento TEXT,
      pago INTEGER DEFAULT 0,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
      FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pedido_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER DEFAULT 1,
      preco_unitario REAL,
      FOREIGN KEY (pedido_id) REFERENCES pedidos_loja(id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS yoga_planos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      nome_plano TEXT NOT NULL,
      frequencia_semanal INTEGER DEFAULT 2,
      aulas_por_mes INTEGER,
      valor_online REAL,
      valor_presencial REAL,
      reposicao_dias INTEGER DEFAULT 30,
      antecedencia_cancelamento_horas INTEGER DEFAULT 6,
      ativo INTEGER DEFAULT 1,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS yoga_aulas_avulsas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      valor_online REAL,
      valor_presencial REAL,
      ativo INTEGER DEFAULT 1,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS yoga_assinaturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER,
      plano_id INTEGER,
      data_inicio TEXT,
      data_expiracao TEXT,
      aulas_restantes INTEGER,
      valor_mensalidade REAL,
      data_ultimo_pagamento TEXT,
      dias_em_atraso INTEGER DEFAULT 0,
      status_pagamento TEXT DEFAULT 'pago',
      bloqueado INTEGER DEFAULT 0,
      data_bloqueio TEXT,
      prazo_regularizacao TEXT,
      status TEXT DEFAULT 'ativa',
      FOREIGN KEY (paciente_id) REFERENCES usuarios(id),
      FOREIGN KEY (plano_id) REFERENCES yoga_planos(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS yoga_reposicoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assinatura_id INTEGER,
      aula_faltada_id INTEGER,
      data_falta TEXT,
      data_limite_reposicao TEXT,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','agendada','expirada')),
      FOREIGN KEY (assinatura_id) REFERENCES yoga_assinaturas(id),
      FOREIGN KEY (aula_faltada_id) REFERENCES agendamentos(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS revenda_certificados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assinatura_id INTEGER,
      tipo TEXT CHECK(tipo IN ('A1','A3')),
      custo_aquisicao REAL,
      preco_venda REAL,
      margem_percentual REAL DEFAULT 30,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','emitido','entregue','expirado','pendente_validacao')),
      data_emissao TEXT,
      data_validade TEXT,
      FOREIGN KEY (assinatura_id) REFERENCES assinaturas(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS revenda_dominios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assinatura_id INTEGER,
      dominio TEXT,
      extensao TEXT,
      custo_aquisicao REAL,
      preco_venda REAL,
      margem_percentual REAL DEFAULT 30,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','registrado','ativo','expirado')),
      data_registro TEXT,
      data_expiracao TEXT,
      FOREIGN KEY (assinatura_id) REFERENCES assinaturas(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      desconto_percentual REAL DEFAULT 100,
      planos_validos TEXT,
      uso_ilimitado INTEGER DEFAULT 1,
      acesso_vitalicio INTEGER DEFAULT 1,
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS logs_auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      acao TEXT NOT NULL,
      tabela_afetada TEXT,
      registro_id INTEGER,
      dados_anteriores TEXT,
      dados_novos TEXT,
      ip TEXT,
      user_agent TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_arquivo TEXT NOT NULL,
      tamanho_bytes INTEGER,
      tipo TEXT CHECK(tipo IN ('diario','semanal','mensal','manual')),
      caminho TEXT NOT NULL,
      status TEXT CHECK(status IN ('sucesso','falha')),
      criado_em TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notificacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      titulo TEXT NOT NULL,
      mensagem TEXT,
      tipo TEXT CHECK(tipo IN ('lembrete','confirmacao','cancelamento','pagamento','sistema','lgpd','assinatura')),
      lida INTEGER DEFAULT 0,
      canal TEXT CHECK(canal IN ('whatsapp','email','push','sistema')),
      status_envio TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT,
      valor TEXT,
      usuario_id INTEGER,
      descricao TEXT,
      UNIQUE(chave, usuario_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS config_anamnese_parte1 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      especialidade_id INTEGER,
      campos_ativos TEXT,
      campos_obrigatorios TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    );
  `);

  console.log('✅ Todas as tabelas criadas com sucesso!');
}

function inserirDadosIniciais() {
  
  const especialidades = [
    { nome: 'Fitoterapia', descricao: 'Tratamento com plantas medicinais', exige_presencial: 0 },
    { nome: 'Ayurveda', descricao: 'Medicina tradicional indiana', exige_presencial: 0 },
    { nome: 'MTC', descricao: 'Medicina Tradicional Chinesa', exige_presencial: 0 },
    { nome: 'Acupuntura', descricao: 'Técnica com agulhas - MTC', exige_presencial: 1 },
    { nome: 'Xamanismo', descricao: 'Práticas xamânicas e rituais', exige_presencial: 0 },
    { nome: 'Massoterapia', descricao: 'Massagem terapêutica', exige_presencial: 1 },
    { nome: 'Fisioterapia', descricao: 'Reabilitação física', exige_presencial: 1 },
    { nome: 'Yoga', descricao: 'Práticas de yoga e meditação', exige_presencial: 0 },
    { nome: 'Psicologia', descricao: 'Atendimento psicológico', exige_presencial: 0 },
    { nome: 'Nutrição', descricao: 'Orientação nutricional', exige_presencial: 0 },
    { nome: 'Reiki', descricao: 'Terapia energética', exige_presencial: 0 },
    { nome: 'Quiropraxia', descricao: 'Ajustes quiropráticos', exige_presencial: 1 },
    { nome: 'Osteopatia', descricao: 'Tratamento osteopático', exige_presencial: 1 },
    { nome: 'Reflexologia', descricao: 'Massagem nos pés e mãos', exige_presencial: 1 },
    { nome: 'Aromaterapia', descricao: 'Tratamento com óleos essenciais', exige_presencial: 0 },
    { nome: 'Auriculoterapia', descricao: 'Estimulação de pontos na orelha', exige_presencial: 1 }
  ];

  const insertEspecialidade = db.prepare('INSERT OR IGNORE INTO especialidades (nome, descricao, exige_presencial) VALUES (?, ?, ?)');
  for (const esp of especialidades) { insertEspecialidade.run(esp.nome, esp.descricao, esp.exige_presencial); }

  const senhaHash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT OR IGNORE INTO usuarios (nome, email, senha, tipo, ativo) VALUES (?, ?, ?, ?, ?)").run('Criador do Integra', 'admin@integra.com', senhaHash, 'super_admin', 1);

  db.prepare("INSERT OR IGNORE INTO cupons (codigo, desconto_percentual, planos_validos, uso_ilimitado, acesso_vitalicio, ativo) VALUES (?, ?, ?, ?, ?, ?)").run('PRESENTEDOMAU', 100, '["pro","enterprise"]', 1, 1, 1);

  console.log('✅ Dados iniciais inseridos!');
  console.log('📧 Admin: admin@integra.com / senha: admin123');
}

function inicializarBanco() {
  console.log('🚀 Inicializando banco de dados...');
  criarTabelas();
  inserirDadosIniciais();
  console.log('🎉 Banco de dados pronto!');
}

inicializarBanco();
module.exports = db;