const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('📦 PostgreSQL conectado!');

async function criarTabelas() {
  const client = await db.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        telefone TEXT,
        cpf TEXT UNIQUE,
        data_nascimento TEXT,
        sexo TEXT,
        tipo TEXT NOT NULL CHECK(tipo IN ('paciente','profissional','recepcionista','financeiro','admin','super_admin','rh')),
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
        gateway_preferido TEXT,
        gateway_token TEXT,
        gateway_email TEXT,
        evolution_instancia TEXT,
        evolution_token TEXT,
        plano TEXT DEFAULT 'freemium',
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
        idioma_preferido TEXT DEFAULT 'pt-BR',
        ativo INTEGER DEFAULT 1,
        criado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER UNIQUE REFERENCES usuarios(id),
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
        observacoes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS especialidades (
        id SERIAL PRIMARY KEY,
        nome TEXT UNIQUE NOT NULL,
        descricao TEXT,
        exige_presencial INTEGER DEFAULT 0,
        ativo INTEGER DEFAULT 1
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS profissional_valores (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        especialidade_id INTEGER REFERENCES especialidades(id),
        valor_online REAL,
        valor_presencial REAL,
        duracao_minutos INTEGER DEFAULT 60
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES usuarios(id),
        profissional_id INTEGER REFERENCES usuarios(id),
        especialidade_id INTEGER REFERENCES especialidades(id),
        data_agendamento TEXT NOT NULL,
        horario_inicio TEXT NOT NULL,
        horario_fim TEXT NOT NULL,
        modalidade TEXT CHECK(modalidade IN ('online','presencial')),
        valor REAL,
        status TEXT DEFAULT 'agendado',
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
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS profissional_regras_agendamento (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER UNIQUE REFERENCES usuarios(id),
        antecedencia_minima_horas INTEGER DEFAULT 24,
        prazo_cancelamento_horas INTEGER DEFAULT 12,
        multa_falta_valor REAL,
        limite_reagendamentos_mes INTEGER DEFAULT 2,
        tolerancia_atraso_minutos INTEGER DEFAULT 10,
        bloqueio_apos_faltas INTEGER DEFAULT 3
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS profissional_horarios (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        dia_semana INTEGER CHECK(dia_semana BETWEEN 0 AND 6),
        horario_inicio TEXT,
        horario_fim TEXT,
        intervalo_minutos INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS profissional_bloqueios (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        data_inicio TEXT,
        data_fim TEXT,
        motivo TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS formularios_levantamento (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES usuarios(id),
        profissional_id INTEGER REFERENCES usuarios(id),
        especialidade_id INTEGER REFERENCES especialidades(id),
        parte1_estado_atual TEXT,
        parte2_ficha_complementar TEXT,
        status TEXT DEFAULT 'pendente',
        criado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS modelos_ficha_complementar (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        especialidade_id INTEGER REFERENCES especialidades(id),
        nome_modelo TEXT,
        campos TEXT,
        padrao INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prontuarios (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES usuarios(id),
        profissional_id INTEGER REFERENCES usuarios(id),
        data_sessao TEXT,
        evolucao TEXT,
        anexos TEXT,
        notas_internas TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prescricoes (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES usuarios(id),
        profissional_id INTEGER REFERENCES usuarios(id),
        tipo TEXT CHECK(tipo IN ('prescricao','solicitacao','controle_especial')),
        itens TEXT,
        exames_sugeridos TEXT,
        observacoes TEXT,
        data_prescricao TIMESTAMP DEFAULT NOW(),
        valida_ate TEXT,
        status TEXT DEFAULT 'ativa'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS banco_terapeutico (
        id SERIAL PRIMARY KEY,
        especialidade_id INTEGER REFERENCES especialidades(id),
        tipo TEXT CHECK(tipo IN ('medicamento','tratamento','dieta','exame','erva','oleo','tecnica','asana','ritual','dosha','dhatu','rasa','virya','vipaka')),
        nome TEXT NOT NULL,
        descricao TEXT,
        contraindicacoes TEXT,
        dosagem_padrao TEXT,
        ativo INTEGER DEFAULT 1,
        criado_por INTEGER REFERENCES usuarios(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS assinaturas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        plano TEXT,
        tipo_ciclo TEXT CHECK(tipo_ciclo IN ('mensal','semestral','anual')),
        valor REAL,
        data_inicio TEXT,
        data_expiracao TEXT,
        renovacao_automatica INTEGER DEFAULT 0,
        parcelas INTEGER DEFAULT 1,
        multa_cancelamento_percentual REAL DEFAULT 20,
        status TEXT DEFAULT 'ativa',
        contrato_pdf TEXT,
        data_aceite TEXT,
        ip_aceite TEXT,
        data_cancelamento TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pagamentos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        agendamento_id INTEGER REFERENCES agendamentos(id),
        assinatura_id INTEGER REFERENCES assinaturas(id),
        pedido_loja_id INTEGER,
        tipo TEXT,
        valor REAL,
        forma_pagamento TEXT,
        parcelas INTEGER DEFAULT 1,
        gateway TEXT,
        gateway_transaction_id TEXT,
        status TEXT DEFAULT 'pendente',
        comprovante_url TEXT,
        observacoes TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notas_fiscais (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        pagamento_id INTEGER REFERENCES pagamentos(id),
        tipo TEXT CHECK(tipo IN ('nfe','nfse')),
        numero TEXT,
        serie TEXT,
        chave_acesso TEXT,
        valor_total REAL,
        status TEXT DEFAULT 'pendente',
        autorizada_por INTEGER REFERENCES usuarios(id),
        data_autorizacao TEXT,
        xml_url TEXT,
        pdf_url TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        nome TEXT NOT NULL,
        descricao TEXT,
        preco REAL NOT NULL,
        estoque INTEGER DEFAULT 0,
        categoria TEXT,
        imagem_url TEXT,
        digital INTEGER DEFAULT 0,
        arquivo_digital_url TEXT,
        ativo INTEGER DEFAULT 1,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pedidos_loja (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES usuarios(id),
        vendedor_id INTEGER REFERENCES usuarios(id),
        origem TEXT CHECK(origem IN ('virtual','fisica')),
        valor_total REAL,
        frete_valor REAL,
        status TEXT DEFAULT 'pendente',
        endereco_entrega TEXT,
        forma_pagamento TEXT,
        pago INTEGER DEFAULT 0,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pedido_itens (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER REFERENCES pedidos_loja(id),
        produto_id INTEGER REFERENCES produtos(id),
        quantidade INTEGER DEFAULT 1,
        preco_unitario REAL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS yoga_planos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        nome_plano TEXT NOT NULL,
        frequencia_semanal INTEGER DEFAULT 2,
        aulas_por_mes INTEGER,
        valor_online REAL,
        valor_presencial REAL,
        reposicao_dias INTEGER DEFAULT 30,
        ativo INTEGER DEFAULT 1
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS yoga_assinaturas (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES usuarios(id),
        plano_id INTEGER REFERENCES yoga_planos(id),
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
        status TEXT DEFAULT 'ativa'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS yoga_reposicoes (
        id SERIAL PRIMARY KEY,
        assinatura_id INTEGER REFERENCES yoga_assinaturas(id),
        aula_faltada_id INTEGER REFERENCES agendamentos(id),
        data_falta TEXT,
        data_limite_reposicao TEXT,
        status TEXT DEFAULT 'pendente'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS massagem_planos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        nome_plano TEXT NOT NULL,
        sessoes_por_mes INTEGER,
        valor_online REAL,
        valor_presencial REAL,
        reposicao_dias INTEGER DEFAULT 30,
        ativo INTEGER DEFAULT 1
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS massagem_assinaturas (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES usuarios(id),
        plano_id INTEGER REFERENCES massagem_planos(id),
        data_inicio TEXT,
        data_expiracao TEXT,
        sessoes_restantes INTEGER,
        valor_total REAL,
        tipo_pagamento TEXT DEFAULT 'a_vista',
        parcelas INTEGER DEFAULT 1,
        status TEXT DEFAULT 'ativa'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS revenda_certificados (
        id SERIAL PRIMARY KEY,
        assinatura_id INTEGER REFERENCES assinaturas(id),
        tipo TEXT CHECK(tipo IN ('A1','A3')),
        custo_aquisicao REAL,
        preco_venda REAL,
        margem_percentual REAL DEFAULT 30,
        status TEXT DEFAULT 'pendente',
        data_validade TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS revenda_dominios (
        id SERIAL PRIMARY KEY,
        assinatura_id INTEGER REFERENCES assinaturas(id),
        dominio TEXT,
        extensao TEXT,
        custo_aquisicao REAL,
        preco_venda REAL,
        margem_percentual REAL DEFAULT 30,
        status TEXT DEFAULT 'pendente',
        data_expiracao TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cupons (
        id SERIAL PRIMARY KEY,
        codigo TEXT UNIQUE NOT NULL,
        desconto_percentual REAL DEFAULT 100,
        planos_validos TEXT,
        uso_ilimitado INTEGER DEFAULT 1,
        acesso_vitalicio INTEGER DEFAULT 1,
        ativo INTEGER DEFAULT 1,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS logs_auditoria (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        acao TEXT NOT NULL,
        tabela_afetada TEXT,
        registro_id INTEGER,
        dados_anteriores TEXT,
        dados_novos TEXT,
        ip TEXT,
        user_agent TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        nome_arquivo TEXT NOT NULL,
        tamanho_bytes INTEGER,
        tipo TEXT CHECK(tipo IN ('diario','semanal','mensal','manual')),
        caminho TEXT NOT NULL,
        status TEXT CHECK(status IN ('sucesso','falha')),
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        titulo TEXT NOT NULL,
        mensagem TEXT,
        tipo TEXT,
        lida INTEGER DEFAULT 0,
        canal TEXT,
        status_envio TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        chave TEXT,
        valor TEXT,
        usuario_id INTEGER REFERENCES usuarios(id),
        descricao TEXT,
        UNIQUE(chave, usuario_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS config_anamnese_parte1 (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        especialidade_id INTEGER REFERENCES especialidades(id),
        campos_ativos TEXT,
        campos_obrigatorios TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS funcionarios (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES usuarios(id),
        nome TEXT NOT NULL,
        cpf TEXT,
        pis TEXT,
        ctps TEXT,
        cargo TEXT,
        salario REAL,
        data_admissao TEXT,
        data_desligamento TEXT,
        status TEXT DEFAULT 'ativo',
        anotacoes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS folha_pagamento (
        id SERIAL PRIMARY KEY,
        funcionario_id INTEGER REFERENCES funcionarios(id),
        mes_referencia TEXT,
        salario_bruto REAL,
        inss_descontado REAL,
        irrf_descontado REAL,
        fgts REAL,
        salario_liquido REAL,
        contracheque_gerado INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS guias_emitidas (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES usuarios(id),
        tipo TEXT CHECK(tipo IN ('DAS','GPS','FGTS','INSS_COMPLEMENTAR','ISS')),
        valor REAL,
        data_vencimento TEXT,
        data_emissao TIMESTAMP DEFAULT NOW(),
        status TEXT DEFAULT 'pendente'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS config_previdencia (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER UNIQUE REFERENCES usuarios(id),
        tipo_contribuicao TEXT DEFAULT 'minimo',
        salarios_contribuicao INTEGER DEFAULT 1
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS retornos (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES usuarios(id),
        profissional_id INTEGER REFERENCES usuarios(id),
        consulta_original_id INTEGER REFERENCES agendamentos(id),
        data_limite TEXT,
        status TEXT DEFAULT 'pendente',
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notificacoes_pagamento (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        assinatura_id INTEGER REFERENCES assinaturas(id),
        tipo_assinatura TEXT,
        dias_antecedencia INTEGER,
        data_vencimento TEXT,
        enviada INTEGER DEFAULT 0,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS artigos_blog (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        titulo TEXT NOT NULL,
        conteudo TEXT,
        imagem_url TEXT,
        publicado INTEGER DEFAULT 0,
        criado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS templates_mensagens (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        tipo TEXT,
        canal TEXT DEFAULT 'whatsapp',
        assunto TEXT,
        mensagem TEXT,
        variaveis TEXT,
        ativo INTEGER DEFAULT 1,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS migracao_dados (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        tipo TEXT,
        arquivo_original TEXT,
        registros_importados INTEGER,
        registros_ignorados INTEGER,
        status TEXT DEFAULT 'concluido',
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS extratos_bancarios (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        arquivo_original TEXT,
        banco TEXT,
        data_inicio TEXT,
        data_fim TEXT,
        total_creditos REAL,
        total_debitos REAL,
        conciliado INTEGER DEFAULT 0,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Todas as tabelas criadas com sucesso!');
  } finally {
    client.release();
  }
}

async function inserirDadosIniciais() {
  const client = await db.connect();
  try {
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

    for (const esp of especialidades) {
      await client.query(
        'INSERT INTO especialidades (nome, descricao, exige_presencial) VALUES ($1, $2, $3) ON CONFLICT (nome) DO NOTHING',
        [esp.nome, esp.descricao, esp.exige_presencial]
      );
    }

    const senhaHash = await bcrypt.hash('admin123', 12);
    await client.query(
      "INSERT INTO usuarios (nome, email, senha, tipo, ativo) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING",
      ['Criador do Integrativo.App', 'admin@integra.com', senhaHash, 'super_admin', 1]
    );

    await client.query(
      "INSERT INTO cupons (codigo, desconto_percentual, planos_validos, uso_ilimitado, acesso_vitalicio, ativo) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (codigo) DO NOTHING",
      ['PRESENTEDOMAU', 100, '["premium"]', 1, 1, 1]
    );

    console.log('✅ Dados iniciais inseridos!');
    console.log('📧 Admin: admin@integra.com / senha: admin123');
    console.log('🎟️ Cupom PRESENTEDOMAU ativado para Premium vitalício!');
  } finally {
    client.release();
  }
}

async function inicializarBanco() {
  console.log('🚀 Inicializando banco de dados PostgreSQL...');
  await criarTabelas();
  await inserirDadosIniciais();
  console.log('🎉 Banco de dados pronto para uso!');
}

inicializarBanco();

module.exports = db;