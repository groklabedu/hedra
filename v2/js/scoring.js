// Mapeamento questão → dimensão (conforme especificação HEDRA 2.0)
const AUTODOMINIO_IDS = new Set([1, 5, 10, 14, 18, 21, 27, 31, 33, 37, 41, 46]);
const DIRECAO_IDS     = new Set([2, 6,  9, 13, 17, 22, 28, 30, 35, 38, 42, 45]);
const INFLUENCIA_IDS  = new Set([3, 7, 11, 15, 19, 23, 25, 29, 34, 39, 43, 47]);
const MAESTRIA_IDS    = new Set([4, 8, 12, 16, 20, 24, 26, 32, 36, 40, 44, 48]);

// Questões invertidas: pontuação = 10 − resposta (sem peso extra)
const INVERTIDAS = new Set([5, 9, 11, 12, 17, 21, 23, 24, 29, 33, 35, 36, 41, 45, 47, 48]);

const MAX_DIM   = 120; // 12 questões × 10
const THRESHOLD = 70;  // corte dos quadrantes em %
const PISO_LIDER = 60; // todas as dimensões ≥ 60% para ser Líder

const PERFIS = {
  operador: {
    nome: 'Operador Sobrecarregado',
    cor: '#CC4400',
    descricao: `Você está atuando no modo execução constante, com pouca clareza de direção e baixo impacto no desenvolvimento do time. Seu dia a dia é marcado por excesso de tarefas e urgências, sensação de estar sempre apagando incêndios, dificuldade de priorizar o que realmente importa, equipe dependente de você para resolver problemas. Na prática, você trabalha muito… mas lidera pouco. A maior armadilha aqui é: acreditar que fazer mais é o caminho, quando na verdade o que falta é direção e consciência.`,
  },
  executor: {
    nome: 'Executor Eficiente',
    cor: '#1A5276',
    descricao: `Você tem boa capacidade de organização, decisão e entrega. Sabe o que precisa ser feito — e faz. Mas ainda carrega um padrão forte de centralização, execução individual, baixa delegação com autonomia, foco em resultado com menor foco no desenvolvimento das pessoas. Na prática, você garante a entrega… mas ainda não multiplica o impacto. A principal armadilha aqui é: acreditar que eficiência operacional é liderança suficiente.`,
  },
  comunicador: {
    nome: 'Comunicador Frágil',
    cor: '#B7770D',
    descricao: `Você tem boa conexão com as pessoas e gera proximidade no time. É visto como alguém acessível, que escuta e se relaciona bem. Porém, pode apresentar dificuldade de se posicionar com firmeza, evitação de conversas difíceis, falta de clareza na direção, excesso de empatia sem sustentação de decisão. Na prática, você engaja… mas não direciona com consistência. A principal armadilha aqui é: priorizar o conforto da relação em vez da clareza da liderança.`,
  },
  lider: {
    nome: 'Líder de Influência Estratégica',
    cor: '#1A6B45',
    descricao: `Você demonstra um nível mais maduro de liderança, integrando direção e impacto. Sua atuação tende a definir prioridades com clareza, sustentar decisões com segurança, mobilizar pessoas e engajar o time, desenvolver autonomia e formar novos líderes. Você não apenas executa — você direciona, influencia e constrói resultado através das pessoas. O ponto de atenção aqui é: não acomodar-se no nível atual e continuar expandindo seu impacto no sistema.`,
  },
};

function calcularScore(respostas) {
  let autodominio = 0, direcao = 0, influencia = 0, maestria = 0;

  respostas.forEach((val, i) => {
    const id     = i + 1;
    const pontos = INVERTIDAS.has(id) ? (10 - val) : val;

    if      (AUTODOMINIO_IDS.has(id)) autodominio += pontos;
    else if (DIRECAO_IDS.has(id))     direcao     += pontos;
    else if (INFLUENCIA_IDS.has(id))  influencia  += pontos;
    else if (MAESTRIA_IDS.has(id))    maestria    += pontos;
  });

  // Converter para percentual 0–100
  const pctAuto = Math.round((autodominio / MAX_DIM) * 100);
  const pctDir  = Math.round((direcao     / MAX_DIM) * 100);
  const pctInf  = Math.round((influencia  / MAX_DIM) * 100);
  const pctMae  = Math.round((maestria    / MAX_DIM) * 100);

  const eixoX = pctDir;
  const eixoY = Math.round((pctInf + pctMae) / 2);

  let perfil;
  if      (eixoX <  THRESHOLD && eixoY <  THRESHOLD) perfil = 'operador';
  else if (eixoX >= THRESHOLD && eixoY <  THRESHOLD) perfil = 'executor';
  else if (eixoX <  THRESHOLD && eixoY >= THRESHOLD) perfil = 'comunicador';
  else {
    // Candidato a Líder: todas as 4 dimensões devem estar ≥ 60%
    const todasAcimaDoPiso = pctAuto >= PISO_LIDER && pctDir >= PISO_LIDER
                          && pctInf  >= PISO_LIDER && pctMae >= PISO_LIDER;
    perfil = todasAcimaDoPiso ? 'lider' : 'executor';
  }

  return {
    autodominio: pctAuto,
    direcao:     pctDir,
    influencia:  pctInf,
    maestria:    pctMae,
    eixoX,
    eixoY,
    perfil,
  };
}
