const PARTES = [
  { numero: 1, titulo: 'Autodomínio',  descricao: 'Como você lida com suas emoções e reações em situações de pressão.' },
  { numero: 2, titulo: 'Direção',      descricao: 'Como você define prioridades, toma decisões e guia o time com clareza.' },
  { numero: 3, titulo: 'Influência',   descricao: 'Como você se posiciona, se comunica e impacta as pessoas ao seu redor.' },
  { numero: 4, titulo: 'Maestria',     descricao: 'Como você desenvolve pessoas, delega e gera autonomia no time.' },
];

// trap: true → pergunta invertida com peso 2 no cálculo
const PERGUNTAS = [
  // ── Bloco 1: Autodomínio ─────────────────────────────────────────────────
  { id:  1, parte: 1, texto: 'Eu consigo manter a calma em situações de pressão.' },
  { id:  2, parte: 1, texto: 'Tenho consciência do impacto do meu estado emocional no time.' },
  { id:  3, parte: 1, texto: 'Consigo perceber quando estou reagindo no automático.' },
  { id:  4, parte: 1, texto: 'Me considero um líder equilibrado emocionalmente.' },
  { id:  5, parte: 1, texto: 'Faço pausas conscientes antes de responder em situações tensas.' },
  { id:  6, parte: 1, texto: 'Consigo identificar meus principais gatilhos emocionais no trabalho.' },
  { id:  7, parte: 1, texto: 'Em reuniões difíceis, consigo sustentar presença.' },
  { id:  8, parte: 1, texto: 'Reviso mentalmente situações do dia para entender meu comportamento.' },
  { id:  9, parte: 1, texto: 'Minhas reações geram segurança no time.' },
  { id: 10, parte: 1, texto: 'As pessoas confiam na minha estabilidade emocional.' },
  { id: 11, parte: 1, texto: 'Já reagi no impulso e me arrependi depois.', trap: true },
  { id: 12, parte: 1, texto: 'Em momentos de pressão, ajo de forma diferente do líder que eu gostaria de ser.', trap: true },

  // ── Bloco 2: Direção ─────────────────────────────────────────────────────
  { id: 13, parte: 2, texto: 'Tenho clareza sobre as prioridades da minha equipe.' },
  { id: 14, parte: 2, texto: 'Me considero um líder com boa capacidade de decisão.' },
  { id: 15, parte: 2, texto: 'Consigo direcionar o time com clareza.' },
  { id: 16, parte: 2, texto: 'Tenho visão clara do que é importante, e consigo alinhar com o time.' },
  { id: 17, parte: 2, texto: 'Defino prioridades claras semanalmente, de forma organizada e estruturada.' },
  { id: 18, parte: 2, texto: 'Sustento decisões mesmo quando sou questionado, sem recuar.' },
  { id: 19, parte: 2, texto: 'Diferencio urgência de prioridade estratégica.' },
  { id: 20, parte: 2, texto: 'Finalizo reuniões com próximos passos definidos e clareza nos encaminhamentos.' },
  { id: 21, parte: 2, texto: 'Meu time sabe exatamente o que precisa entregar.' },
  { id: 22, parte: 2, texto: 'As decisões avançam com clareza na minha liderança.' },
  { id: 23, parte: 2, texto: 'Minha agenda é dominada por urgências e problemas.', trap: true },
  { id: 24, parte: 2, texto: 'Adio decisões importantes mais do que gostaria.', trap: true },

  // ── Bloco 3: Influência ──────────────────────────────────────────────────
  { id: 25, parte: 3, texto: 'Me posiciono com clareza em reuniões.' },
  { id: 26, parte: 3, texto: 'Tenho facilidade em lidar com conversas difíceis.' },
  { id: 27, parte: 3, texto: 'Sou ouvido com atenção quando falo.' },
  { id: 28, parte: 3, texto: 'Consigo influenciar decisões.' },
  { id: 29, parte: 3, texto: 'Dou feedbacks diretos, quando necessário, mesmo quando a conversa é difícil.' },
  { id: 30, parte: 3, texto: 'Expresso discordância de forma clara mesmo com superiores ou pares.' },
  { id: 31, parte: 3, texto: 'Trago minha opinião mesmo quando é desconfortável e não foi solicitada.' },
  { id: 32, parte: 3, texto: 'Conduzo conversas difíceis sem evitar e o mais rápido possível.' },
  { id: 33, parte: 3, texto: 'Minha opinião gera movimento nas decisões.' },
  { id: 34, parte: 3, texto: 'O time se engaja nas direções que proponho.' },
  { id: 35, parte: 3, texto: 'Na última semana, evitei alguma conversa tensa.', trap: true },
  { id: 36, parte: 3, texto: 'Já saí de uma reunião pensando "eu deveria ter falado e não falei".', trap: true },

  // ── Bloco 4: Maestria ────────────────────────────────────────────────────
  { id: 37, parte: 4, texto: 'Desenvolvo pessoas no meu time.' },
  { id: 38, parte: 4, texto: 'Minha liderança gera impacto positivo.' },
  { id: 39, parte: 4, texto: 'Consigo formar novos líderes.' },
  { id: 40, parte: 4, texto: 'Tenho um papel relevante na evolução do time.' },
  { id: 41, parte: 4, texto: 'Delego de forma a desenvolver autonomia.' },
  { id: 42, parte: 4, texto: 'Estimulo o time a tomar decisões.' },
  { id: 43, parte: 4, texto: 'Desenvolvo pessoas intencionalmente.' },
  { id: 44, parte: 4, texto: 'Cobro resultados sem gerar dependência.' },
  { id: 45, parte: 4, texto: 'Meu time tem maturidade e resolve problemas sem depender de mim.' },
  { id: 46, parte: 4, texto: 'O ambiente melhora com minha presença e liderança.' },
  { id: 47, parte: 4, texto: 'Se eu me ausento, o time parece que perde ritmo.', trap: true },
  { id: 48, parte: 4, texto: 'Ainda sou o principal ponto de decisão da equipe.', trap: true },
];
