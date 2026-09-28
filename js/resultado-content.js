// Conteúdo estático das páginas de resultado — um objeto por perfil
const RC = {

  p2_resumos: {
    operador:    'Faz muito e absorve grande parte das demandas da operação. Demonstra comprometimento, responsabilidade e disponibilidade. Pode ter dificuldade em priorizar, delegar e sustentar decisões. Sob pressão, tende a assumir ainda mais para garantir a entrega.',
    executor:    'Entrega resultados com agilidade, clareza e forte capacidade de execução. Demonstra domínio técnico, objetividade e segurança para decidir. Pode centralizar decisões e limitar a autonomia da equipe. Sob pressão, tende a confiar ainda mais na própria capacidade de resolver.',
    comunicador: 'Constrói boas relações, proximidade e confiança com a equipe. Demonstra empatia, escuta e facilidade de conexão. Pode evitar conflitos, adiar decisões ou suavizar posicionamentos importantes. Sob pressão, tende a preservar relações mesmo quando a situação exige maior firmeza.',
    lider:       'Combina clareza de direção com capacidade de mobilizar pessoas. Desenvolve autonomia, influencia decisões e amplia a capacidade do time. Pode correr o risco de confiar excessivamente na própria leitura ou influência. Sob pressão, precisa preservar abertura, escuta e capacidade de revisão.',
  },

  perfis: {
    operador: {
      headline: 'FAZ MUITO. DECIDE POUCO.',
      p3_intro: [
        'O Operador Sobrecarregado costuma demonstrar comprometimento, disponibilidade e disposição para fazer acontecer.',
        'Seu principal desafio geralmente não está na falta de esforço, mas justamente no excesso dele.',
        'Diante das demandas, tende a assumir tarefas, resolver problemas e responder às urgências. Ao fazer isso repetidamente, pode tornar-se o principal ponto de dependência da operação.',
        'Quanto mais resolve pessoalmente, menos tempo encontra para priorizar, direcionar, delegar e desenvolver pessoas.',
      ],
      forcas: ['Comprometimento com as entregas.', 'Disposição para ajudar.', 'Proximidade da operação.', 'Conhecimento dos problemas cotidianos.', 'Responsabilidade.', 'Velocidade de resposta diante de demandas.'],
      pontos: ['Excesso de atividades operacionais.', 'Dificuldade de separar urgência de prioridade.', 'Centralização.', 'Equipe dependente.', 'Pouco espaço para planejamento.', 'Decisões importantes adiadas.', 'Pouco tempo dedicado ao desenvolvimento de pessoas.'],
      pressao: [
        'Sob pressão, sua tendência pode ser responder ao aumento das demandas aumentando ainda mais seu próprio esforço.',
        'Podem aparecer dificuldade em dizer não, receio de decepcionar outras pessoas, desconforto ao delegar, necessidade de sentir-se útil e dificuldade em aceitar que algumas entregas aconteçam de maneira diferente da sua.',
        'Esses elementos não representam um diagnóstico psicológico. São padrões possíveis de atenção associados ao modo como a liderança pode reagir em situações de maior exigência.',
        'Quanto mais inseguro se sente em relação à entrega, mais o líder pode assumir pessoalmente — e quanto mais assume, mais dependente a equipe se torna.',
      ],
      movimento: 'Do "eu resolvo" para o "eu defino, direciono e acompanho".',
      prioridade: 'AMPLIAR DIREÇÃO',
      p4_titulo: 'CRIAR DIREÇÃO',
      p4_steps: ['Priorizar', 'Decidir', 'Delegar', 'Estabelecer expectativas', 'Acompanhar'],
      p4_perguntas: [
        'O que somente eu deveria estar fazendo como líder?',
        'Que decisões estou adiando?',
        'Quais tarefas minha equipe já poderia assumir?',
        'Quais são as três prioridades que deveriam orientar meu time agora?',
      ],
      p5_texto: [
        'Sua disposição para assumir responsabilidades, apoiar a equipe e fazer acontecer é uma força importante da sua liderança.',
        'Seu próximo movimento não está em aumentar ainda mais o esforço, mas em transformar parte dessa energia em priorização, decisão e direção.',
        'Quanto mais você conseguir deixar de ser o principal resolvedor da operação e passar a orientar com clareza o que precisa acontecer, maior será a autonomia da equipe e menor será a dependência da sua presença.',
        'Seu desenvolvimento começa quando o "eu faço" passar gradualmente a dar espaço ao "eu direciono, delego e acompanho".',
      ],
    },

    executor: {
      headline: 'ENTREGA RESULTADO, MAS AINDA CONCENTRA LIDERANÇA.',
      p3_intro: [
        'O Executor Eficiente costuma ser reconhecido por sua capacidade de realização.',
        'Decide, resolve problemas, domina sua área e transforma demandas em entregas.',
        'O risco aparece quando a própria competência do líder passa a ser o principal mecanismo através do qual os resultados acontecem.',
        'Ele entrega. Mas nem sempre multiplica.',
      ],
      forcas: ['Elevada capacidade de execução.', 'Agilidade na resolução de problemas.', 'Clareza para decidir.', 'Conhecimento técnico.', 'Orientação para resultados.', 'Capacidade de priorização.', 'Confiabilidade.'],
      pontos: ['Centralização.', 'Baixa delegação.', 'Equipe preparada para executar, mas pouco preparada para decidir.', 'Impaciência diante de ritmos diferentes.', 'Baixa formação de sucessores.', 'Dependência da presença do líder.', 'Dificuldade em abrir espaço para aprendizado através do erro.'],
      pressao: [
        'Quanto maior a pressão, maior pode ser a tendência de recorrer àquilo que historicamente produziu resultado: sua própria capacidade de resolver.',
        'Podem surgir necessidade elevada de controle, impaciência, dificuldade em confiar na execução dos outros, resistência a abordagens diferentes e postura defensiva quando sua forma de condução é questionada.',
        'Seu risco não é acreditar pouco em sua capacidade. É acreditar tanto nela que deixa pouco espaço para a capacidade dos outros aparecer.',
      ],
      movimento: 'Sair de quem entrega resultado para quem constrói pessoas capazes de entregar resultado.',
      prioridade: 'AMPLIAR IMPACTO',
      p4_titulo: 'AMPLIAR IMPACTO',
      p4_steps: ['Delegar', 'Confiar', 'Desenvolver', 'Mobilizar', 'Formar'],
      p4_perguntas: [
        'Quais decisões ainda chegam até mim sem necessidade?',
        'Quem estou preparando para assumir responsabilidades maiores?',
        'Estou resolvendo problemas ou formando pessoas capazes de resolvê-los?',
        'Se eu me afastasse por 30 dias, quanto da operação continuaria funcionando com autonomia?',
      ],
      p5_texto: [
        'Sua capacidade de decidir, resolver problemas e transformar demandas em resultados é um recurso valioso da sua liderança.',
        'Seu próximo movimento está menos em executar melhor e mais em ampliar o impacto através das pessoas.',
        'À medida que você desenvolve autonomia, distribui decisões e forma pessoas capazes de assumir responsabilidades maiores, sua liderança deixa de depender apenas da sua competência individual.',
        'O avanço acontece quando sua capacidade de entrega começa a se transformar também em capacidade de multiplicação.',
      ],
    },

    comunicador: {
      headline: 'CONECTA PESSOAS, MAS AINDA NÃO SUSTENTA DIREÇÃO.',
      p3_intro: [
        'O Comunicador Frágil tende a construir boas relações.',
        'Escuta, acolhe, cria proximidade e frequentemente estabelece um ambiente de confiança.',
        'Seu desafio aparece quando preservar a relação se torna mais importante do que sustentar a direção.',
        'Conversas necessárias podem ser adiadas. Decisões podem perder firmeza. Prioridades podem permanecer pouco explícitas.',
      ],
      forcas: ['Empatia.', 'Escuta ativa.', 'Proximidade.', 'Capacidade de construir confiança.', 'Boa comunicação interpessoal.', 'Sensibilidade ao ambiente.', 'Facilidade de conexão.'],
      pontos: ['Dificuldade em enfrentar conflitos necessários.', 'Decisões adiadas.', 'Excesso de concessões.', 'Falta de clareza sobre prioridades.', 'Feedback excessivamente suavizado.', 'Expectativas implícitas.', 'Busca excessiva por consenso.'],
      pressao: [
        'Por valorizar relações, pertencimento e harmonia, pode surgir maior desconforto em situações nas quais liderar significa frustrar expectativas ou sustentar uma decisão impopular.',
        'Podem aparecer necessidade de aceitação, sensibilidade à desaprovação, receio de desagradar, busca excessiva por consenso e dificuldade em separar vínculo de concordância.',
        'Quanto maior a necessidade de preservar o vínculo, maior pode ser o risco de evitar justamente as conversas que poderiam fortalecê-lo.',
      ],
      movimento: 'Transformar conexão em direção.',
      prioridade: 'AMPLIAR DIREÇÃO',
      p4_titulo: 'SUSTENTAR DIREÇÃO',
      p4_steps: ['Posicionar', 'Explicitar', 'Decidir', 'Conversar', 'Sustentar'],
      p4_perguntas: [
        'Que conversa importante estou evitando?',
        'Minha equipe sabe exatamente quais são nossas prioridades?',
        'Em que momento estou confundindo empatia com ausência de posicionamento?',
        'Que expectativa precisa ser explicitada?',
      ],
      p5_texto: [
        'Sua capacidade de construir relações, ouvir, gerar confiança e criar proximidade é uma força importante da sua liderança.',
        'Seu próximo movimento está em acrescentar clareza, posicionamento e direção a essa capacidade de conexão.',
        'Liderar também significa sustentar decisões, explicitar expectativas e conduzir conversas que nem sempre serão confortáveis.',
        'Quanto mais você conseguir combinar relacionamento com firmeza, maior será sua capacidade de gerar confiança sem perder direção.',
      ],
    },

    lider: {
      headline: 'DEFINE DIREÇÃO E MOBILIZA PESSOAS.',
      p3_intro: [
        'O Líder de Influência Estratégica combina clareza de direção e capacidade de mobilização.',
        'Não apenas produz resultados. Constrói as condições para que outras pessoas também consigam produzi-los.',
        'Define prioridades, toma decisões, sustenta conversas difíceis, desenvolve autonomia e amplia a capacidade coletiva do time.',
        'Seu impacto começa a aparecer menos somente naquilo que faz e mais naquilo que as pessoas conseguem fazer a partir de sua liderança.',
      ],
      forcas: ['Clareza estratégica.', 'Tomada de decisão consistente.', 'Capacidade de influência.', 'Mobilização.', 'Desenvolvimento de autonomia.', 'Condução de conversas difíceis.', 'Formação de novos líderes.', 'Impacto sustentável sobre resultados.'],
      pontos: ['Distanciamento da operação.', 'Excesso de confiança no próprio julgamento.', 'Risco de considerar o alinhamento já garantido.', 'Pouca escuta de posições divergentes.', 'Apego à própria influência.', 'Dificuldade de perceber mudanças de contexto.'],
      pressao: [
        'Sob pressão, pode surgir excesso de confiança na própria leitura, menor abertura a sinais divergentes, impaciência com pessoas menos autônomas ou tendência a acreditar que sua mensagem foi suficientemente compreendida.',
        'Quanto maior a influência conquistada, maior também a necessidade de preservar abertura e capacidade de revisão.',
        'Em níveis mais altos de influência, o risco deixa de ser apenas tomar uma decisão inadequada. Pode passar a ser mobilizar muitas pessoas em torno de uma direção que deveria ter sido questionada.',
      ],
      movimento: 'Transformar influência pessoal em capacidade organizacional.',
      prioridade: 'AMPLIAR ESCALA',
      p4_titulo: 'AMPLIAR ESCALA',
      p4_steps: ['Formar líderes', 'Distribuir influência', 'Construir cultura', 'Institucionalizar', 'Sustentar'],
      p4_perguntas: [
        'Minha liderança continua funcionando quando não estou presente?',
        'Quantas pessoas estou preparando para liderar melhor?',
        'Minha equipe toma boas decisões sem minha participação?',
        'Estou deixando apenas resultados ou capacidade instalada?',
      ],
      p5_texto: [
        'Seu resultado demonstra uma combinação consistente entre direção e capacidade de mobilizar pessoas.',
        'Sua principal oportunidade agora está em ampliar a escala dessa liderança.',
        'Isso significa transformar influência pessoal em autonomia, formação de novos líderes, cultura e capacidade organizacional.',
        'Quanto mais sua equipe conseguir tomar boas decisões, desenvolver outras pessoas e sustentar resultados sem depender diretamente da sua presença, maior será a maturidade da sua liderança.',
      ],
    },
  },
};
