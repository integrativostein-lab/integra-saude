const CONFIG = {
  // ═══════════════════════════════════════════
  // MODO DE OPERAÇÃO
  // ═══════════════════════════════════════════
  MODO: 'teste', // 'teste' ou 'producao'

  // ═══════════════════════════════════════════
  // URLs
  // ═══════════════════════════════════════════
  API_URL: 'https://integra-backend-ynrd.onrender.com/api',
  FRONTEND_URL: 'https://integra-saude-psi.vercel.app',
  NOME_SISTEMA: 'Integrativo.App',
  VERSAO: '2.0.0',

  // ═══════════════════════════════════════════
  // 30 ESPECIALIDADES
  // ═══════════════════════════════════════════
  ESPECIALIDADES: [
    'Fitoterapia', 'Ayurveda', 'MTC', 'Yoga', 'Massoterapia', 'Aromaterapia',
    'Fisioterapia', 'Xamanismo', 'Florais de Bach', 'Reiki', 'Reflexologia',
    'Medicina Integrativa', 'Jyotish', 'Vastu Shastra', 'Quiropraxia',
    'Osteopatia', 'Cromoterapia', 'Musicoterapia', 'Equoterapia', 'Apiterapia',
    'Hidroterapia', 'Acupuntura', 'Medicina Tradicional', 'Farmacologia',
    'Pediatria', 'Ginecologia', 'Geriatria', 'Saúde Mental',
    'Medicina de Família', 'Emergência'
  ],

  // ═══════════════════════════════════════════
  // PLANOS E PREÇOS
  // ═══════════════════════════════════════════
  PLANOS: {
    freemium: {
      nome: 'Freemium', valor_mensal: 0, taxa_consulta: 6.5,
      max_teleconsultas: 30, max_agendamentos: 70, max_whatsapp: 30,
      max_pacientes: 50, recepcao: 0, blog: 0, rh: false,
      white_label: false, api_white_label: false, migracao: false,
      conciliacao: false, especialidades_inclusas: 1, max_especialidades_extras: 29,
      abrath_desconto: 0, pix_desconto: 5
    },
    pro: {
      nome: 'Pro', valor_mensal: 89.90, valor_semestral: 539.40, valor_anual: 1078.80, taxa_consulta: 2.5,
      max_teleconsultas: 150, max_agendamentos: 500, max_whatsapp: 1000,
      max_pacientes: 300, recepcao: 1, blog: 10, rh: 'basico',
      white_label: true, api_white_label: false, migracao: true,
      conciliacao: false, especialidades_inclusas: 30, abrath_desconto: 10, pix_desconto: 5
    },
    premium: {
      nome: 'Premium', valor_mensal: 479.90, valor_semestral: 2879.40, valor_anual: 5758.80, taxa_consulta: 2.5,
      max_teleconsultas: Infinity, max_agendamentos: Infinity, max_whatsapp: Infinity,
      max_pacientes: 1000, recepcao: 3, blog: Infinity, rh: 'completo',
      white_label: true, api_white_label: true, migracao: true,
      conciliacao: true, especialidades_inclusas: 30, abrath_desconto: 10, pix_desconto: 5
    },
    enterprise: {
      nome: 'Enterprise', valor_mensal: 999.00, valor_semestral: 5994.00, valor_anual: 11988.00, taxa_consulta: 2.5,
      max_teleconsultas: Infinity, max_agendamentos: Infinity, max_whatsapp: Infinity,
      max_pacientes: Infinity, recepcao: Infinity, blog: Infinity, rh: 'completo',
      white_label: true, api_white_label: true, migracao: true,
      conciliacao: true, especialidades_inclusas: 30, certificado_a1_gratis: true,
      abrath_desconto: 10, pix_desconto: 5
    },
    coworking: {
      nome: 'Coworking', valor_mensal: 1599.90, taxa_consulta: 2.5,
      max_teleconsultas: Infinity, max_agendamentos: Infinity, max_whatsapp: Infinity,
      max_pacientes: Infinity, recepcao: Infinity, blog: Infinity, rh: 'completo',
      white_label: true, api_white_label: true, migracao: true,
      conciliacao: true, especialidades_inclusas: 30, certificado_a1_gratis: true,
      abrath_desconto: 0, pix_desconto: 5
    }
  },

  // ═══════════════════════════════════════════
  // PARCELAMENTO
  // ═══════════════════════════════════════════
  PARCELAMENTO: {
    semestral: { max_sem_juros: 2 },
    anual: { max_sem_juros: 3, min_com_juros: 4, max_com_juros: 6, juros_cartao: 3.0 }
  },

  // ═══════════════════════════════════════════
  // MÓDULOS EXTRAS
  // ═══════════════════════════════════════════
  MODULOS_PRECOS: {
    '9.90': ['Florais de Bach', 'Reiki', 'Reflexologia', 'Xamanismo', 'Cromoterapia', 'Musicoterapia'],
    '14.90': ['Fitoterapia', 'Yoga', 'Massoterapia', 'Aromaterapia', 'Fisioterapia', 'Hidroterapia', 'Equoterapia'],
    '19.90': ['Medicina Tradicional', 'Farmacologia', 'Pediatria', 'Ginecologia', 'Geriatria', 'Saúde Mental', 'Medicina de Família', 'Emergência'],
    '24.90': ['Ayurveda', 'MTC', 'Medicina Integrativa', 'Acupuntura', 'Quiropraxia', 'Osteopatia', 'Apiterapia'],
    '29.90': ['Jyotish', 'Vastu Shastra']
  },

  MODULOS_DESCONTOS: {
    '1-3': { tres_meses: 0, depois: 0 },
    '4-9': { tres_meses: 50, depois: 20 },
    '10+': { tres_meses: 50, depois: 30 }
  },

  // ═══════════════════════════════════════════
  // PRAZOS E MULTAS
  // ═══════════════════════════════════════════
  PRAZOS: { arrependimento_dias: 10, reposicao_yoga_dias: 30, notificacao_renovacao_dias: 15 },
  MULTAS: { cancelamento_consulta: 20, desmarcar_consulta: 10 },

  // ═══════════════════════════════════════════
  // GATEWAYS
  // ═══════════════════════════════════════════
  GATEWAYS: [
    { id: 'pagseguro', nome: 'PagSeguro', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
    { id: 'pagbank', nome: 'PagBank', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
    { id: 'asaas', nome: 'Asaas', taxa_cartao: '2,99%', taxa_pix: '1,99%' },
    { id: 'ton', nome: 'Ton', taxa_cartao: '1,99%', taxa_pix: '0,99%' },
    { id: 'mercadopago', nome: 'Mercado Pago', taxa_cartao: '3,99%', taxa_pix: '1,99%' },
    { id: 'efi', nome: 'Efi Bank', taxa_cartao: '1,99%', taxa_pix: '1,99%' },
    { id: 'cielo', nome: 'Cielo', taxa_cartao: 'Variável', taxa_pix: '1,99%' },
    { id: 'stone', nome: 'Stone', taxa_cartao: 'Variável', taxa_pix: '1,99%' }
  ],

  // ═══════════════════════════════════════════
  // SUPORTE
  // ═══════════════════════════════════════════
  SUPORTE: {
    segunda: '10h - 19h', terca: '10h - 19h', quarta: '13h - 17h',
    quinta: '10h - 19h', sexta: '13h - 17h', sabado: 'Fechado', domingo: 'Fechado'
  },

  // ═══════════════════════════════════════════
  // IDIOMAS
  // ═══════════════════════════════════════════
  IDIOMAS: ['pt-BR', 'en', 'es', 'fr', 'ru', 'hi', 'zh', 'af', 'zu'],
  IDIOMAS_BANDEIRAS: { 'pt-BR': '🇧🇷', 'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'ru': '🇷🇺', 'hi': '🇮🇳', 'zh': '🇨🇳', 'af': '🇿🇦', 'zu': '🇿🇦' }
};
window.CONFIG = CONFIG;