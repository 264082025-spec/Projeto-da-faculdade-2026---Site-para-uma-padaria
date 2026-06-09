/* ================================================================
   SANTIAGO PADARIA ARTESANAL — main.js
   
   JavaScript progressivo: o site funciona sem JS, mas com JS
   fica mais rico (navegação mobile, animações, validação).
   
   ÍNDICE:
   01. Navbar — scroll effect & mobile menu
   02. Intersection Observer — animações ao scrollar
   03. Filtro de Produtos — busca e categorias
   04. Star Rating — interatividade
   05. Shop Selector — toggle de lojas
   06. Validação de Formulários
   07. Inicialização
================================================================ */

'use strict'; // Modo estrito: previne erros silenciosos e boas práticas

/* ================================================================
   CONCEITO — DOMContentLoaded vs. window.load
   
   DOMContentLoaded: dispara quando o HTML foi completamente
   parseado e o DOM está pronto. Imagens e CSS podem ainda estar
   carregando. É o evento correto para manipular o DOM.
   
   window.load: dispara quando TUDO carregou (imagens, CSS, JS).
   Mais lento — use apenas quando realmente precisar das imagens.
================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ================================================================
     01. NAVBAR — Efeito de scroll & Menu mobile
     
     CONCEITO — Element.classList
     classList é uma API moderna do DOM que gerencia classes CSS
     de forma eficiente. Métodos principais:
     • .add('class')    — adiciona uma classe
     • .remove('class') — remove uma classe
     • .toggle('class') — adiciona se não existe, remove se existe
     • .contains('class') — retorna true/false
     
     CONCEITO — window.scrollY
     Propriedade que retorna a posição vertical do scroll em pixels.
     Threshold de 50px: após rolar 50px, a navbar muda de visual.
  ================================================================ */
  const navbar = document.querySelector('.navbar');
  const menuBtn = document.querySelector('.navbar__menu-btn');
  const mobileMenu = document.querySelector('.navbar__mobile-menu');

  // Efeito de blur/escurecimento da navbar ao scrollar
  const hasHero = document.querySelector('.hero');

  const handleScroll = () => {
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  };

  if (hasHero) {
    // Páginas com hero: navbar transparente no topo, sólida ao scrollar
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
  } else {
    // Páginas sem hero (login, cadastro, produtos, feedback):
    // navbar sempre sólida para manter legibilidade
    navbar?.classList.add('scrolled');
  }
  // { passive: true } — dica ao browser de que não vamos preventDefault().
  // Permite que o browser otimize o scroll sem esperar o JS responder.

  // Toggle do menu mobile (hambúrguer)
  menuBtn?.addEventListener('click', () => {
    const isOpen = menuBtn.classList.toggle('open');
    mobileMenu?.classList.toggle('open', isOpen);
    // Previne scroll do body enquanto menu está aberto
    document.body.style.overflow = isOpen ? 'hidden' : '';
    // Acessibilidade: atualiza aria-expanded para leitores de tela
    menuBtn.setAttribute('aria-expanded', isOpen);
  });

  // Fecha menu mobile ao clicar em um link
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });


  /* ================================================================
     02. INTERSECTION OBSERVER — Animações ao Scrollar
     
     CONCEITO — Intersection Observer API
     API nativa do browser (sem jQuery ou libs externas) que detecta
     quando um elemento entra ou sai da viewport. Muito mais
     performático que a abordagem antiga (window.scroll + getBoundingClientRect).
     
     Como funciona:
     1. Criamos um Observer com um callback e opções (threshold, rootMargin)
     2. "Observamos" elementos com .observe(element)
     3. O callback é chamado com uma lista de IntersectionObserverEntry
     4. entry.isIntersecting = true quando o elemento está visível
     
     threshold: 0.1 = callback dispara quando 10% do elemento está visível
     rootMargin: '-50px' = margem negativa, dispara um pouco antes de entrar
  ================================================================ */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Após revelar, paramos de observar (performance)
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '-30px 0px' }
  );

  // Observa todos os elementos com classe .reveal
  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });


  /* ================================================================
     03. FILTRO DE PRODUTOS
     
     CONCEITO — Filtragem no DOM via data-attributes
     data-* são atributos HTML personalizados que armazenam dados
     no próprio elemento. Não têm efeito visual, servem como "tags".
     
     Ex.: <div class="product-card" data-category="paes">
     
     Acesso via JS: element.dataset.category → "paes"
     
     ALGORITMO:
     1. Escuta o input de busca (event: 'input')
     2. Escuta os botões de categoria (event: 'click')
     3. Para cada card: verifica se nome contém o termo E se a
        categoria é a selecionada (ou 'todos')
     4. Mostra/oculta com display: none (mais simples que CSS classes)
  ================================================================ */
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');
  const categoryHeaders = document.querySelectorAll('.category-section');

  let currentCategory = 'todos';
  let currentSearch = '';

  const filterProducts = () => {
    // Converte para minúsculas para comparação case-insensitive
    const searchTerm = currentSearch.toLowerCase().trim();

    productCards.forEach(card => {
      const category = card.dataset.category || '';
      const name = card.querySelector('.product-card__name')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.product-card__desc')?.textContent.toLowerCase() || '';

      const matchesCategory = currentCategory === 'todos' || category === currentCategory;
      const matchesSearch = !searchTerm || name.includes(searchTerm) || desc.includes(searchTerm);

      // display toggle: 'block' mostra, 'none' oculta
      card.style.display = matchesCategory && matchesSearch ? '' : 'none';
    });

    // Oculta headers de categorias que não têm cards visíveis
    categoryHeaders?.forEach(section => {
      const visibleCards = section.querySelectorAll('.product-card:not([style*="none"])');
      const anyVisible = Array.from(visibleCards).some(c => c.style.display !== 'none');
      section.style.display = visibleCards.length === 0 || !anyVisible ? 'none' : '';
    });
  };

  // Debounce na busca: espera 300ms após o usuário parar de digitar
  // Evita filtrar a cada tecla pressionada (performance)
  let searchDebounce;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      currentSearch = e.target.value;
      filterProducts();
    }, 300);
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove .active de todos, adiciona no clicado
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      filterProducts();
    });
  });


  /* ================================================================
     04. STAR RATING — Sistema de avaliação interativo
     
     CONCEITO — Event Delegation
     Em vez de adicionar um listener em cada estrela (n eventos),
     adicionamos UM listener no container pai. Quando o usuário
     clica em uma estrela, o evento "borbulha" (bubbles up) até
     o container. Verificamos event.target para saber qual estrela.
     
     É muito mais eficiente quando há muitos elementos filhos.
  ================================================================ */
  const starsInputs = document.querySelectorAll('.stars-input');

  starsInputs.forEach(starsInput => {
    const labels = starsInput.querySelectorAll('label');
    const inputs = starsInput.querySelectorAll('input[type="radio"]');

    // Efeito hover: ilumina todas até a estrela hovered
    starsInput.addEventListener('mousemove', (e) => {
      const label = e.target.closest('label');
      if (!label) return;
      const index = Array.from(labels).indexOf(label);
      labels.forEach((l, i) => {
        l.style.color = i <= index ? 'var(--c-gold-light)' : 'var(--c-border)';
      });
    });

    starsInput.addEventListener('mouseleave', () => {
      // Ao sair: volta ao estado do radio selecionado
      const checked = starsInput.querySelector('input:checked');
      const checkedIndex = checked ? Array.from(inputs).indexOf(checked) : -1;
      labels.forEach((l, i) => {
        l.style.color = i <= checkedIndex ? 'var(--c-gold)' : 'var(--c-border)';
      });
    });
  });


  /* ================================================================
     05. SHOP SELECTOR — Toggle de lojas (Feedback)
  ================================================================ */
  const shopBtns = document.querySelectorAll('.shop-selector__btn');

  shopBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      shopBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });


  /* ================================================================
     06. VALIDAÇÃO DE FORMULÁRIOS
     
     CONCEITO — Validação Client-Side vs Server-Side
     Validação client-side (no browser/JS) é para UX: feedback
     imediato e rápido. NUNCA substitui a validação server-side.
     Usuário pode desabilitar JS ou manipular requests.
     
     ESTRATÉGIA: Validate on blur (quando sai do campo) + no submit.
     Não validar enquanto digita (frustante para o usuário).
     
     CONCEITO — Regex (Expressões Regulares)
     Padrões de texto para validar formatos.
     /^[^\s@]+@[^\s@]+\.[^\s@]+$/  — valida e-mail básico:
       ^ = início da string
       [^\s@]+ = um ou mais chars que não são espaço ou @
       @ = literal @
       \. = ponto literal (. sem \ = qualquer char)
       $ = fim da string
  ================================================================ */
  const forms = document.querySelectorAll('form[data-validate]');

  const validators = {
    required: (value) => value.trim().length > 0,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    minLength: (value, min) => value.trim().length >= parseInt(min),
    phone: (value) => /^[\d\s\(\)\-\+]{10,}$/.test(value),
    cep: (value) => /^\d{5}-?\d{3}$/.test(value),
    passwordMatch: (value, field) => {
      const other = document.getElementById(field);
      return other ? value === other.value : true;
    }
  };

  const showError = (input, message) => {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    input.classList.add('error');
    let errorMsg = formGroup.querySelector('.form-error-msg');
    if (!errorMsg) {
      errorMsg = document.createElement('span');
      errorMsg.className = 'form-error-msg';
      formGroup.appendChild(errorMsg);
    }
    errorMsg.textContent = message;
  };

  const clearError = (input) => {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    input.classList.remove('error');
    const errorMsg = formGroup.querySelector('.form-error-msg');
    if (errorMsg) errorMsg.remove();
  };

  const validateInput = (input) => {
    const rules = input.dataset.validate?.split('|') || [];
    for (const rule of rules) {
      const [ruleName, ruleArg] = rule.split(':');
      const isValid = validators[ruleName]?.(input.value, ruleArg) ?? true;
      if (!isValid) {
        const messages = {
          required: 'Este campo é obrigatório.',
          email: 'Insira um e-mail válido.',
          minLength: `Mínimo de ${ruleArg} caracteres.`,
          phone: 'Insira um telefone válido.',
          cep: 'CEP inválido. Formato: 00000-000',
          passwordMatch: 'As senhas não coincidem.'
        };
        showError(input, messages[ruleName] || 'Campo inválido.');
        return false;
      }
    }
    clearError(input);
    return true;
  };

  forms.forEach(form => {
    // Valida ao sair de um campo (blur)
    form.querySelectorAll('[data-validate]').forEach(input => {
      input.addEventListener('blur', () => validateInput(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) validateInput(input);
      });
    });

    // Valida tudo ao submeter
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // Previne envio nativo (sem processamento server-side aqui)

      const inputs = form.querySelectorAll('[data-validate]');
      let allValid = true;

      inputs.forEach(input => {
        if (!validateInput(input)) allValid = false;
      });

      if (allValid) {
        showSuccess(form);
      }
    });
  });

  // Feedback visual de sucesso no envio
  const showSuccess = (form) => {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = '✓ Enviado com sucesso!';
    btn.style.background = 'var(--c-success)';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  };


  /* ================================================================
     07. UTILITÁRIOS GERAIS
  ================================================================ */

  // Marca o link ativo da navbar baseado na URL atual
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__link').forEach(link => {
    const linkHref = link.getAttribute('href')?.split('/').pop();
    if (linkHref === currentPath) {
      link.classList.add('active');
    }
  });

  // Smooth scroll para links internos (âncoras)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: offset - 80, behavior: 'smooth' });
      }
    });
  });

  console.log('%c🥖 Santiago Padaria Artesanal', 'font-size:16px;font-weight:bold;color:#c8a96e');
  console.log('%c Site carregado com sucesso!', 'color:#a8967f');

}); // fim do DOMContentLoaded