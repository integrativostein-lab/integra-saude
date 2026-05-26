// ============================================
// ENTRADA DE DADOS POR VOZ (WEB SPEECH API)
// ============================================

const Voz = {
  recognition: null,
  campoAtivo: null,
  iconeAtivo: null,
  ouvindo: false,

  // Inicializar reconhecimento de voz
  iniciar() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('⚠️ Navegador não suporta reconhecimento de voz');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      let texto = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        texto += event.results[i][0].transcript;
      }
      if (this.campoAtivo) {
        this.campoAtivo.value = texto;
      }
    };

    this.recognition.onerror = (event) => {
      console.log('❌ Erro no reconhecimento:', event.error);
      this.parar();
    };

    this.recognition.onend = () => {
      if (this.ouvindo) {
        this.recognition.start();
      }
    };
  },

  // Alternar gravação
  toggle(campo, icone) {
    if (!this.recognition) {
      alert('Seu navegador não suporta entrada por voz.');
      return;
    }

    if (this.ouvindo) {
      this.parar();
    } else {
      this.campoAtivo = campo;
      this.iconeAtivo = icone;
      this.ouvindo = true;
      this.recognition.start();
      if (icone) icone.textContent = '🔴';
      campo.placeholder = '🎙️ Ouvindo...';
    }
  },

  // Parar gravação
  parar() {
    this.ouvindo = false;
    if (this.recognition) this.recognition.stop();
    if (this.iconeAtivo) this.iconeAtivo.textContent = '🎙️';
    if (this.campoAtivo) this.campoAtivo.placeholder = '';
    this.campoAtivo = null;
    this.iconeAtivo = null;
  },

  // Adicionar botão de microfone a um campo
  adicionarMicrofone(campo) {
    if (!campo) return;
    
    // Criar wrapper
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;display:flex;align-items:center;';
    campo.parentNode.insertBefore(wrapper, campo);
    wrapper.appendChild(campo);

    // Criar botão do microfone
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '🎙️';
    btn.title = 'Clique para ditar — sua voz NÃO é gravada, apenas transcrita';
    btn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;cursor:pointer;padding:4px;';
    
    btn.onclick = () => this.toggle(campo, btn);
    wrapper.appendChild(btn);

    // Ajustar padding do campo para não sobrepor o ícone
    campo.style.paddingRight = '36px';
  }
};

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  Voz.iniciar();

  // Adicionar microfone a campos de texto livre (prontuário, anamnese, etc.)
  document.querySelectorAll('.campo-voz').forEach(campo => {
    Voz.adicionarMicrofone(campo);
  });
});

window.Voz = Voz;