const I18N = {
  currentLang: 'pt-BR',
  translations: {
    'pt-BR': {
      'hero.titulo': 'Encontre seu terapeuta integrativo ideal',
      'hero.subtitulo': 'Ayurveda · MTC · Fitoterapia · Massoterapia · Yoga',
      'hero.buscar': 'Buscar Profissionais',
      'nav.entrar': 'Entrar',
      'footer.direitos': '🌿 Integra - Saúde Integrativa'
    },
    'en': {
      'hero.titulo': 'Find your ideal integrative therapist',
      'hero.buscar': 'Find Professionals',
      'nav.entrar': 'Login',
      'footer.direitos': '🌿 Integra - Integrative Health'
    },
    'es': {
      'hero.titulo': 'Encuentra tu terapeuta ideal',
      'hero.buscar': 'Buscar Profesionales',
      'nav.entrar': 'Entrar',
      'footer.direitos': '🌿 Integra - Salud Integrativa'
    }
  },
  t(key) { return this.translations[this.currentLang]?.[key] || key; },
  init() {
    const saved = localStorage.getItem('integra_lang');
    if (saved) this.currentLang = saved;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = this.t(el.getAttribute('data-i18n')); });
  }
};
document.addEventListener('DOMContentLoaded', () => I18N.init());
window.I18N = I18N;