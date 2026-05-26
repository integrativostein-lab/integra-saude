const CONFIG = {
  API_URL: 'https://integra-backend-ynrd.onrender.com/api',
  FRONTEND_URL: 'https://integra-saude-psi.vercel.app',
  NOME_SISTEMA: 'Integrativo.App',
  VERSAO: '1.0.0',
  
  ESPECIALIDADES: [
    'Fitoterapia', 'Ayurveda', 'MTC', 'Yoga', 'Massoterapia', 'Aromaterapia',
    'Fisioterapia', 'Xamanismo', 'Florais de Bach', 'Reiki', 'Reflexologia',
    'Medicina Integrativa', 'Jyotish', 'Vastu Shastra', 'Quiropraxia',
    'Osteopatia', 'Cromoterapia', 'Musicoterapia', 'Equoterapia', 'Apiterapia',
    'Hidroterapia', 'Acupuntura', 'Medicina Tradicional', 'Farmacologia',
    'Pediatria', 'Ginecologia', 'Geriatria', 'Saúde Mental',
    'Medicina de Família', 'Emergência'
  ],

  PLANOS: {
    freemium: {
      nome: 'Freemium', valor_mensal: 0,
      max_teleconsultas: 30, max_agendamentos: 70, max_whatsapp: 30,
      max_pacientes: 50, recepcao: 0, blog: 0, rh: false,
      white_label: false, api_white_label: false, migracao: false,
      conciliacao: false, especialidades_inclusas: 1, max_especialidades_extras: 2
    },
    pro: {
      nome: 'Pro', valor_mensal: 79.90, valor_semestral: 431.46, valor_anual: 767.04,
      max_teleconsultas: 150, max_agendamentos: 500, max_whatsapp: 1000,
      max_pacientes: 300, recepcao: 1, blog: 10, rh: 'basico',
      white_label: true, api_white_label: false, migracao: true,
      conciliacao: false, especialidades_inclusas: 4
    },
    premium: {
      nome: 'Premium', valor_mensal: 399.90, valor_semestral: 2159.46, valor_anual: 3839.04,
      max_teleconsultas: Infinity, max_agendamentos: Infinity, max_whatsapp: Infinity,
      max_pacientes: 1000, recepcao: 3, blog: Infinity, rh: 'completo',
      white_label: true, api_white_label: true, migracao: true,
      conciliacao: true, especialidades_inclusas: 8
    },
    enterprise: {
      nome: 'Enterprise', valor_mensal: 799.90, valor_semestral: 4319.46, valor_anual: 7679.04,
      max_teleconsultas: Infinity, max_agendamentos: Infinity, max_whatsapp: Infinity,
      max_pacientes: Infinity, recepcao: Infinity, blog: Infinity, rh: 'completo',
      white_label: true, api_white_label: true, migracao: true,
      conciliacao: true, especialidades_inclusas: 16, certificado_a1_gratis: true
    },
    coworking: {
      nome: 'Coworking', valor_mensal: 1499.90,
      max_teleconsultas: Infinity, max_agendamentos: Infinity, max_whatsapp: Infinity,
      max_pacientes: Infinity, recepcao: Infinity, blog: Infinity, rh: 'completo',
      white_label: true, api_white_label: true, migracao: true,
      conciliacao: true, especialidades_inclusas: 30, certificado_a1_gratis: true
    }
  },

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

  BENEFICIOS_PRIMEIRA_ASSINATURA: {
    semestral: '10 consultas livres de comissão (5%)',
    anual: '1 mês com todas as 30 bibliotecas liberadas + 1 mês sem comissão sobre consultas'
  },

  PARCELAMENTO: { max_semestral: 3, max_anual: 4, sem_juros: true },
  PRAZOS: { arrependimento_dias: 10, reposicao_yoga_dias: 30, notificacao_renovacao_dias: 15 },

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

  SUPORTE: {
    segunda: '10h - 19h', terca: '10h - 19h', quarta: '13h - 17h',
    quinta: '10h - 19h', sexta: '13h - 17h', sabado: 'Fechado', domingo: 'Fechado'
  },

  IDIOMAS: ['pt-BR', 'en', 'es', 'fr', 'ru', 'hi', 'zh', 'af', 'zu']
};
window.CONFIG = CONFIG;