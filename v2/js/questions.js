const PARTES = [
  { numero: 1, titulo: 'Na Rotina Real',        descricao: '' },
  { numero: 2, titulo: 'Decisões e Relações',   descricao: '' },
  { numero: 3, titulo: 'Sob Pressão',            descricao: '' },
  { numero: 4, titulo: 'Liderança em Movimento', descricao: '' },
];

// invertida: true → pontuação = 10 − resposta (sem peso extra)
const PERGUNTAS = [
  // ── Bloco 1: Na Rotina Real ──────────────────────────────────────────────
  { id:  1, parte: 1, texto: 'Quando sou contrariado, questionado ou pressionado, consigo manter o tom e a postura que considero adequados para um líder.' },
  { id:  2, parte: 1, texto: 'No início da semana, consigo definir poucas prioridades realmente importantes para mim e para o time.' },
  { id:  3, parte: 1, texto: 'Quando identifico um comportamento inadequado no time, converso com a pessoa em pouco tempo, em vez de esperar uma ocasião melhor.' },
  { id:  4, parte: 1, texto: 'Quando alguém me traz um problema, normalmente chega também com análise, alternativas ou uma proposta de solução.' },
  { id:  5, parte: 1, texto: 'Em semanas de muita pressão, fico mais impaciente, duro ou reativo com as pessoas.', invertida: true },
  { id:  6, parte: 1, texto: 'Quando uma decisão está sob minha responsabilidade, consigo avançar sem buscar validações desnecessárias.' },
  { id:  7, parte: 1, texto: 'Em reuniões importantes, consigo tornar minha posição compreensível mesmo quando existem opiniões contrárias.' },
  { id:  8, parte: 1, texto: 'Tenho pelo menos uma pessoa sendo preparada intencionalmente para assumir responsabilidades maiores.' },
  { id:  9, parte: 1, texto: 'Problemas inesperados do time frequentemente mudam as prioridades que eu havia planejado para o dia.', invertida: true },
  { id: 10, parte: 1, texto: 'Depois de uma conversa difícil, consigo identificar o que na minha própria postura ajudou ou prejudicou o resultado.' },
  { id: 11, parte: 1, texto: 'Já deixei uma reunião recente pensando: "eu deveria ter falado aquilo e não falei".', invertida: true },
  { id: 12, parte: 1, texto: 'Ainda existem decisões recorrentes que poderiam estar no time, mas continuam concentradas em mim.', invertida: true },

  // ── Bloco 2: Decisões e Relações ─────────────────────────────────────────
  { id: 13, parte: 2, texto: 'Mesmo quando surgem demandas inesperadas, consigo proteger tempo para assuntos importantes que não são urgentes.' },
  { id: 14, parte: 2, texto: 'Quando algo me irrita durante o trabalho, consigo evitar que essa tensão contamine as conversas seguintes.' },
  { id: 15, parte: 2, texto: 'Dou feedbacks específicos sobre comportamento e impacto, e não apenas orientações genéricas sobre o que precisa melhorar.' },
  { id: 16, parte: 2, texto: 'Delego não apenas tarefas, mas também decisões, critérios e responsabilidade pelo resultado.' },
  { id: 17, parte: 2, texto: 'Chego ao fim de semanas muito ocupadas com a sensação de ter trabalhado muito, mas avançado pouco no que era estratégico.', invertida: true },
  { id: 18, parte: 2, texto: 'Diante de uma situação tensa, consigo criar alguns segundos de pausa antes de responder.' },
  { id: 19, parte: 2, texto: 'Quando proponho uma mudança, explico direção, razão e impacto esperado de forma que as pessoas compreendam o movimento.' },
  { id: 20, parte: 2, texto: 'Minha equipe consegue resolver boa parte dos problemas cotidianos sem precisar me envolver diretamente.' },
  { id: 21, parte: 2, texto: 'Já respondi ou tomei uma decisão no impulso e depois pensei que poderia ter conduzido de outra forma.', invertida: true },
  { id: 22, parte: 2, texto: 'Meu time consegue dizer com clareza quais são as prioridades mais importantes neste momento.' },
  { id: 23, parte: 2, texto: 'Já concordei ou permaneci em silêncio diante de uma decisão com a qual discordava para evitar desgaste ou exposição.', invertida: true },
  { id: 24, parte: 2, texto: 'Quando uma entrega é muito importante ou o prazo aperta, minha tendência é acompanhar de perto demais ou assumir parte da execução.', invertida: true },

  // ── Bloco 3: Sob Pressão ─────────────────────────────────────────────────
  { id: 25, parte: 3, texto: 'Quando discordo de uma decisão relevante, exponho meu ponto de vista com clareza, inclusive para pessoas acima de mim na hierarquia.' },
  { id: 26, parte: 3, texto: 'Consigo acompanhar entregas importantes sem precisar interferir constantemente na forma como são executadas.' },
  { id: 27, parte: 3, texto: 'Percebo rapidamente quais situações, pessoas ou comportamentos costumam me tirar do eixo.' },
  { id: 28, parte: 3, texto: 'Minhas reuniões terminam, na maior parte das vezes, com decisão, responsável e próximo passo definidos.' },
  { id: 29, parte: 3, texto: 'Adio algumas conversas difíceis esperando que a situação melhore, que a pessoa perceba sozinha ou que apareça um momento melhor.', invertida: true },
  { id: 30, parte: 3, texto: 'Quando sou questionado sobre uma decisão, consigo sustentá-la ou revisá-la por argumentos — e não apenas pela pressão do momento.' },
  { id: 31, parte: 3, texto: 'Quando percebo que errei na forma de reagir, retomo a situação e corrijo minha postura com a pessoa envolvida.' },
  { id: 32, parte: 3, texto: 'Crio oportunidades reais para que as pessoas aprendam, decidam, errem dentro de limites seguros e ampliem autonomia.' },
  { id: 33, parte: 3, texto: 'Quando estou sobrecarregado, minha capacidade de ouvir diminui e tenho tendência a ir direto para a solução.', invertida: true },
  { id: 34, parte: 3, texto: 'Consigo discordar sem transformar a conversa em confronto pessoal ou recuar apenas para preservar o conforto da relação.' },
  { id: 35, parte: 3, texto: 'Adio algumas decisões porque ainda espero ter mais informação, segurança ou concordância das pessoas envolvidas.', invertida: true },
  { id: 36, parte: 3, texto: 'Minha equipe ainda me procura para resolver problemas que considero que já deveria conseguir resolver sozinha.', invertida: true },

  // ── Bloco 4: Liderança em Movimento ──────────────────────────────────────
  { id: 37, parte: 4, texto: 'Mesmo em dias muito difíceis, minha equipe encontra em mim uma referência de estabilidade e clareza.' },
  { id: 38, parte: 4, texto: 'Consigo dizer "não", renegociar ou redirecionar demandas que competem com prioridades mais importantes.' },
  { id: 39, parte: 4, texto: 'Percebo que minhas conversas geram decisões, mudança de comportamento ou movimento concreto — e não apenas concordância momentânea.' },
  { id: 40, parte: 4, texto: 'Nas últimas semanas, pessoas do meu time tomaram decisões relevantes que anteriormente dependeriam de mim.' },
  { id: 41, parte: 4, texto: 'Há situações recorrentes no trabalho que ainda conseguem me tirar do eixo com facilidade.', invertida: true },
  { id: 42, parte: 4, texto: 'Quando várias demandas chegam ao mesmo tempo, tenho critérios claros para decidir o que entra, espera, delega ou sai.' },
  { id: 43, parte: 4, texto: 'Antes de uma conversa difícil, preparo o que precisa ser dito sem suavizar tanto a mensagem a ponto de perder sua clareza.' },
  { id: 44, parte: 4, texto: 'Quando me ausento por alguns dias, decisões e entregas importantes continuam avançando sem minha intervenção.' },
  { id: 45, parte: 4, texto: 'Ainda assumo pessoalmente algumas demandas porque considero mais rápido fazer do que orientar, delegar ou acompanhar alguém.', invertida: true },
  { id: 46, parte: 4, texto: 'Em situações de pressão, consigo perceber minha reação antes de responder ou tomar uma decisão.' },
  { id: 47, parte: 4, texto: 'Preciso repetir cobranças ou reforçar combinados várias vezes para que algumas coisas realmente aconteçam.', invertida: true },
  { id: 48, parte: 4, texto: 'Se eu me afastasse completamente por duas semanas, algumas decisões ou entregas relevantes provavelmente perderiam ritmo.', invertida: true },
];
