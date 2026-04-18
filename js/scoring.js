const INVERTIDAS = [8, 9, 18, 19, 20, 28, 29, 30, 38, 39, 40];

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
  const r = respostas.map((val, i) =>
    INVERTIDAS.includes(i + 1) ? 10 - val : val
  );

  const autodominio = r.slice(0, 10).reduce((a, b) => a + b, 0);
  const direcao     = r.slice(10, 20).reduce((a, b) => a + b, 0);
  const influencia  = r.slice(20, 30).reduce((a, b) => a + b, 0);
  const maestria    = r.slice(30, 40).reduce((a, b) => a + b, 0);

  const eixoX = direcao;
  const eixoY = (influencia + maestria) / 2;

  let perfil;
  if      (eixoX < 50 && eixoY < 50) perfil = 'operador';
  else if (eixoX >= 50 && eixoY < 50) perfil = 'executor';
  else if (eixoX < 50 && eixoY >= 50) perfil = 'comunicador';
  else                                  perfil = 'lider';

  return { autodominio, direcao, influencia, maestria, eixoX, eixoY, perfil };
}
