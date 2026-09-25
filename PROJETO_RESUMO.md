# Inventário HEDRA — Resumo do Projeto

## O que é

Aplicação web estática de autoavaliação de liderança desenvolvida para **Thelma / Asséssor Consultoria e Treinamento**. O participante responde 48 afirmações e recebe um diagnóstico do seu perfil de liderança em 4 dimensões, com visualização gráfica e possibilidade de exportar o resultado.

URL oficial: `https://groklabedu.github.io/hedra/`  
Repositório: `github.com/groklabedu/hedra` (GitHub Pages, conta `groklabedu`)

---

## Stack técnica

- **HTML/CSS/JS puro** (sem framework)
- **Chart.js 4.4.3** — gráfico de dispersão (Mapa HEDRA) e barras (dimensões)
- **html2canvas 1.4.1 + jsPDF 2.5.1** — exportação como PNG e PDF
- **Google Apps Script** — backend para coleta dos dados (POST → planilha Google)
- **localStorage** — detecção de participante duplicado (chave `hedra_participantes`)
- Hospedagem: **GitHub Pages** (deploy via `git push`)

---

## Estrutura de arquivos

```
hedra/
├── index.html          # Aplicação oficial (versão atual)
├── css/
│   └── style.css
├── js/
│   ├── questions.js    # 48 perguntas + títulos das partes
│   ├── scoring.js      # Lógica de cálculo e perfis
│   ├── charts.js       # Renderização dos gráficos
│   ├── export.js       # Exportação PNG/PDF
│   └── app.js          # Fluxo de telas, formulário, envio
├── assets/
│   └── logo-horizontal.png
├── admin.html          # Painel de administração de respostas
└── v2/                 # Cópia de referência histórica (versão de teste)
```

---

## Fluxo do usuário

1. **Tela 1 — Identificação:** preenche nome, e-mail, telefone (DDD), empresa, cargo, área, estado e cidade. Sistema verifica duplicidade (via API e localStorage) e oferece opção de ver resultado anterior ou refazer.
2. **Tela 2 — Inventário:** 4 partes de 12 afirmações cada (48 no total), usando sliders de 0 a 10. Indicadores de etapa e barra de progresso global.
3. **Reflexão final:** pergunta aberta — "Em qual quadrante você acredita estar?" — com mini-mapa de referência.
4. **Tela 3 — Resultado:** exibe perfil com nome colorido, descrição, Mapa HEDRA (gráfico de dispersão), badges das 4 dimensões com percentual e frase síntese, gráfico de barras e mensagem de fechamento. Botões para exportar PNG e PDF.
5. **Envio automático** dos dados para Google Apps Script (backend) imediatamente ao exibir o resultado.

---

## Dimensões avaliadas (Modelo HEDRA)

| Dimensão     | Questões (IDs)                         | Invertidas nessa dim. |
|--------------|----------------------------------------|-----------------------|
| Autodomínio  | 1,5,10,14,18,21,27,31,33,37,41,46     | 5,21,33,41            |
| Direção      | 2,6,9,13,17,22,28,30,35,38,42,45      | 9,17,35,45            |
| Influência   | 3,7,11,15,19,23,25,29,34,39,43,47     | 11,23,29,47           |
| Maestria     | 4,8,12,16,20,24,26,32,36,40,44,48     | 12,24,36,48           |

**Questões invertidas (total: 16):** pontuação = `10 − resposta` (sem peso extra).

As 48 questões estão distribuídas em 4 blocos temáticos (não por dimensão):
- Parte 1: "Na Rotina Real" (Q1–12)
- Parte 2: "Decisões e Relações" (Q13–24)
- Parte 3: "Sob Pressão" (Q25–36)
- Parte 4: "Liderança em Movimento" (Q37–48)

---

## Lógica de scoring (v2)

```
Para cada questão i (id = i+1):
  pontos = invertida? (10 - resposta) : resposta

Máximo por dimensão = 120 (12 questões × 10)
Score da dimensão em % = round((soma / 120) * 100)

Eixo X = % Direção
Eixo Y = round((% Influência + % Maestria) / 2)
Threshold dos quadrantes = 70%
Piso mínimo para Líder = 60% em todas as 4 dimensões
```

**Mapeamento de perfis:**

| Eixo X | Eixo Y | Condição extra                   | Perfil                        |
|--------|--------|----------------------------------|-------------------------------|
| < 70%  | < 70%  | —                                | Operador Sobrecarregado       |
| ≥ 70%  | < 70%  | —                                | Executor Eficiente            |
| < 70%  | ≥ 70%  | —                                | Comunicador Frágil            |
| ≥ 70%  | ≥ 70%  | alguma dim. < 60%                | Executor Eficiente (piso)     |
| ≥ 70%  | ≥ 70%  | todas as dims. ≥ 60%             | Líder de Influência Estratégica |

---

## Resultado visual

- **Perfil:** nome em cor característica + descrição textual
- **Mapa HEDRA:** scatter chart, escala 0–100%, quadrantes divididos em 70%, ponto marcado em vermelho
- **Badges das dimensões:** grade 2×2 com %, frase síntese e gráfico de barras
- **Mensagem de fechamento:** texto fixo motivacional
- **Exportação:** botão PNG (html2canvas) e botão PDF (jsPDF)

---

## Backend / Admin

- Google Apps Script recebe POST com todos os dados do participante + scores + perfil
- Painel `admin.html` permite visualizar, filtrar e excluir registros individualmente ou em massa
- Logs salvos em planilha Google (a URL do Apps Script está hardcoded em `js/app.js`)

---

## Histórico de versões relevante

| Versão | Mudanças principais |
|--------|---------------------|
| v1 original | 48 questões por dimensão (blocos separados), scoring por soma bruta, threshold absoluto |
| v1 → v2 | Questões reformuladas e redistribuídas em blocos temáticos, 16 questões invertidas, scoring em percentual, piso de 60% para Líder |
| Campo ID | Substituídos: removido "unidade de negócio", adicionados "telefone (DDD)", "estado" e "cidade" |
| Atual | v2 é a versão oficial em produção no link principal |

---

## O que está funcionando hoje

- Inventário completo: formulário → teste → resultado → exportação
- Detecção de duplicidade (localStorage + Apps Script)
- Envio de dados para planilha
- Painel admin
- Deploy via GitHub Pages (push SSH com chave `~/.ssh/id_ed25519_github`, remote alias `git@github.com-groklabedu`)

---

## Pontos de atenção para novos ajustes

- A URL do Apps Script está hardcoded em `js/app.js` — qualquer nova implantação do script exige atualizar essa URL
- O arquivo `v2/` é uma cópia histórica; os arquivos canônicos estão na raiz
- Não há testes automatizados; validação é manual
- Design é mobile-first, max-width 480px, sistema-ui font
- Cores-chave: vermelho `#8B1A1A` (principal), dourado `#C8961A`, fundo `#F9F7F5`
