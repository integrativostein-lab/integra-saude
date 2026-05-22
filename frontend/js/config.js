const CONFIG = {
  API_URL: 'http://localhost:3000/api',
  FRONTEND_URL: 'http://localhost:5500',
  NOME_SISTEMA: 'Integra',
  VERSAO: '1.0.0',
  CORES: {
    azul_escuro: '#1A365D',
    azul_medio: '#2C5282',
    azul_claro: '#EBF4FF',
    laranja: '#DD6B20',
    laranja_claro: '#FEEBC8',
    cinza_claro: '#F7FAFC',
    branco: '#FFFFFF',
    texto_escuro: '#1A202C',
    texto_medio: '#4A5568',
    verde_suave: '#38A169',
    vermelho: '#E53E3E'
  },
  PLANOS: {
    freemium: { nome: 'Freemium', valor_mensal: 0, whatsapp: false, loja: false, nf: false, max_pacientes: 50, recepcao: false },
    pro: { nome: 'Pro', valor_mensal: 54.90, valor_anual: 549.00, whatsapp: true, loja: true, nf: true, max_pacientes: 300, desconto_renovacao: 0, recepcao: true },
    premium: { nome: 'Premium', valor_mensal: 164.90, valor_anual: 1649.00, whatsapp: true, loja: true, nf: true, max_pacientes: 1000, desconto_renovacao: 5, recepcao: true },
    enterprise: { nome: 'Enterprise', valor_mensal: 384.90, valor_anual: 3849.00, whatsapp: true, loja: true, nf: true, max_pacientes: Infinity, desconto_renovacao: 10, recepcao: true }
  },
  PARCELAMENTO: { max_parcelas: 4, sem_juros: true },
  PRAZOS: { arrependimento_dias: 10, reposicao_yoga_dias: 30 }
};
window.CONFIG = CONFIG;