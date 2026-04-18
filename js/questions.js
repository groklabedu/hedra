const PERGUNTAS = [
  // Parte 1: Autodomínio (Q1–Q10)
  { id: 1,  texto: "Eu consigo manter a calma em situações de pressão.", parte: 1, invertida: false },
  { id: 2,  texto: "Tenho consciência do impacto do meu estado emocional no time.", parte: 1, invertida: false },
  { id: 3,  texto: "Antes de responder em situações tensas, eu faço uma pausa consciente.", parte: 1, invertida: false },
  { id: 4,  texto: "Ao longo da semana, percebo quando estou reagindo no automático.", parte: 1, invertida: false },
  { id: 5,  texto: "Consigo identificar meus principais gatilhos no trabalho.", parte: 1, invertida: false },
  { id: 6,  texto: "Minhas reações costumam trazer clareza e segurança para a equipe.", parte: 1, invertida: false },
  { id: 7,  texto: "As pessoas percebem em mim equilíbrio emocional.", parte: 1, invertida: false },
  { id: 8,  texto: "Em dias de pressão, ajo por impulso.", parte: 1, invertida: true },
  { id: 9,  texto: "Levo o estresse do trabalho para as relações com o time.", parte: 1, invertida: true },
  { id: 10, texto: "Ao final da semana, reflito sobre como liderei a mim mesmo.", parte: 1, invertida: false },

  // Parte 2: Direção (Q11–Q20)
  { id: 11, texto: "Tenho clareza sobre as prioridades da minha equipe.", parte: 2, invertida: false },
  { id: 12, texto: "Consigo tomar decisões com segurança.", parte: 2, invertida: false },
  { id: 13, texto: "Diferencio urgência de prioridade estratégica.", parte: 2, invertida: false },
  { id: 14, texto: "Direciono claramente responsáveis e prazos.", parte: 2, invertida: false },
  { id: 15, texto: "Sustento decisões mesmo quando sou questionado.", parte: 2, invertida: false },
  { id: 16, texto: "Meu time sabe exatamente o que precisa entregar.", parte: 2, invertida: false },
  { id: 17, texto: "Minhas reuniões terminam com próximos passos claros.", parte: 2, invertida: false },
  { id: 18, texto: "Mudo de direção com frequência diante de pressão.", parte: 2, invertida: true },
  { id: 19, texto: "Adio decisões importantes por desconforto.", parte: 2, invertida: true },
  { id: 20, texto: "Ajo mais reagindo à agenda do que conduzindo a rota.", parte: 2, invertida: true },

  // Parte 3: Influência (Q21–Q30)
  { id: 21, texto: "Eu me posiciono com clareza em reuniões.", parte: 3, invertida: false },
  { id: 22, texto: "Tenho facilidade para conduzir conversas difíceis.", parte: 3, invertida: false },
  { id: 23, texto: "Dou feedbacks diretos quando necessário.", parte: 3, invertida: false },
  { id: 24, texto: "Expresso discordância de forma produtiva.", parte: 3, invertida: false },
  { id: 25, texto: "Consigo influenciar decisões além de executar.", parte: 3, invertida: false },
  { id: 26, texto: "Minha opinião costuma ser considerada pelo time e pela liderança.", parte: 3, invertida: false },
  { id: 27, texto: "As pessoas se engajam nas mudanças que proponho.", parte: 3, invertida: false },
  { id: 28, texto: "Evito conversas difíceis para não gerar desconforto.", parte: 3, invertida: true },
  { id: 29, texto: "Deixo de me posicionar para evitar conflito.", parte: 3, invertida: true },
  { id: 30, texto: "Sinto que entrego muito, mas sou pouco ouvido.", parte: 3, invertida: true },

  // Parte 4: Maestria (Q31–Q40)
  { id: 31, texto: "Minha liderança desenvolve pessoas.", parte: 4, invertida: false },
  { id: 32, texto: "Contribuo para a evolução da cultura do time.", parte: 4, invertida: false },
  { id: 33, texto: "Delego de forma a desenvolver autonomia.", parte: 4, invertida: false },
  { id: 34, texto: "Formo pessoas para assumir responsabilidades maiores.", parte: 4, invertida: false },
  { id: 35, texto: "Estimulo o time a tomar decisões sem depender de mim.", parte: 4, invertida: false },
  { id: 36, texto: "Meu time resolve problemas sem minha intervenção constante.", parte: 4, invertida: false },
  { id: 37, texto: "Minha liderança melhora o ambiente e a confiança.", parte: 4, invertida: false },
  { id: 38, texto: "Centralizo decisões importantes.", parte: 4, invertida: true },
  { id: 39, texto: "O time ainda depende muito de mim.", parte: 4, invertida: true },
  { id: 40, texto: "Sinto que ainda não deixo o impacto que gostaria como líder.", parte: 4, invertida: true },
];

const PARTES = [
  { numero: 1, titulo: "Autodomínio",  descricao: "Como você lida com suas emoções e reações" },
  { numero: 2, titulo: "Direção",      descricao: "Como você define prioridades e toma decisões" },
  { numero: 3, titulo: "Influência",   descricao: "Como você se posiciona e engaja pessoas" },
  { numero: 4, titulo: "Maestria",     descricao: "Como você desenvolve o time e multiplica impacto" },
];
