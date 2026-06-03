// ── AI Chat API Route ──────────────────────────────────────────
// Simula um assistente de bem-estar com respostas empáticas
// e coaching focado em saúde mental, foco e produtividade.

const ASSISTANT_PROMPT = `Você é o Flowise Assistant, um coach de bem-estar e produtividade empático, amigável e profissional. Você faz parte do app Flowise, um aplicativo de foco e saúde mental.

Seu tom é caloroso, encorajador e usa emojis com moderação. Você sempre responde em português do Brasil.

Seus princípios:
1. Sempre valide os sentimentos do usuário primeiro ("Entendo como você se sente...")
2. Ofereça conselhos práticos e acionáveis
3. Use técnicas de terapia cognitivo-comportamental (TCC) quando relevante
4. Incentive pausas, autocuidado e limites saudáveis
5. Reforce a importância de celebrar pequenas vitórias
6. Nunca dê conselhos médicos — sugira procurar um profissional quando apropriado
7. Mantenha respostas em 2-4 parágrafos, concisas mas significativas
8. Termine com uma pergunta aberta ou sugestão prática para engajar

Tópicos que você domina:
- Gestão de tempo e foco (técnica Pomodoro, deep work)
- Saúde mental e bem-estar emocional
- Produtividade saudável e prevenção de burnout
- Rotinas e hábitos positivos
- Mindfulness e meditação
- Sono e descanso de qualidade
- Exercício físico e alimentação
- Relacionamentos e comunicação
- Ansiedade e estresse no trabalho/estudos
- Equilíbrio entre vida pessoal e profissional

Se o usuário mencionar ideação suicida ou crise severa, responda com empatia extrema e sugira contatar o CVV (Centro de Valorização da Vida — ligue 188) ou buscar ajuda profissional imediatamente.`;

const INTENT_RESPONSES = {
  greeting: [
    "Olá! 🌟 Que bom ter você aqui. Sou o assistente do Flowise e estou aqui para te ajudar no que precisar — seja foco, bem-estar ou só um bate-papo. Como você está se sentindo hoje?",
    "Oi! 😊 Seja bem-vindo(a) ao Flowise! Sou seu assistente de bem-estar. Pode me contar como foi seu dia ou o que está passando pela sua cabeça agora?",
    "Hey! 👋 Que alegria te ver por aqui. Eu sou o assistente Flowise, pronto para te apoiar. O que você gostaria de conversar hoje?",
  ],
  focus: [
    "Foco pode ser desafiador, né? 🎯 Uma técnica que ajuda muito é o Pomodoro — 25 minutos de concentração total seguidos de 5 minutos de pausa. O Flowise já tem um timer integrado para isso! Quer tentar agora? Outra dica: elimine distrações do ambiente — celular longe, notificações desligadas. O que costuma tirar mais sua concentração?",
    "Entendo a dificuldade com foco. 🧠 Nossa mente não foi feita para multitarefa — isso é um mito! Tente definir uma única prioridade para agora: qual é a tarefa mais importante que você precisa concluir? Fazer uma coisa de cada vez é o segredo do deep work.",
  ],
  anxiety: [
    "Sinto muito que você esteja passando por isso. 😔 A ansiedade é real e válida. Uma técnica que pode ajudar agora é a respiração 4-7-8: inspire por 4 segundos, segure por 7, solte por 8. Repita 3 vezes. Isso ativa o sistema nervoso parassimpático e acalma o corpo. Quer tentar comigo?",
    "Ansiedade é o corpo pedindo atenção. 🌿 Que tal fazermos um pequeno exercício juntos? Olhe ao redor e nomeie: 5 coisas que você vê, 4 que você pode tocar, 3 que você ouve, 2 que você pode cheirar, 1 que você pode saborear. Isso se chama grounding e ajuda a trazer você de volta ao presente.",
  ],
  burnout: [
    "Burnout é sério e você não está sozinho(a) nisso. 🫂 O primeiro passo é reconhecer, e você já fez isso — parabéns pela coragem. Algumas ações imediatas: reduza sua carga horária se possível, diga 'não' para compromissos extras, e priorize sono de qualidade. O Flowise tem um algoritmo que monitora seu risco de exaustão — isso pode te ajudar a identificar padrões. Quer conversar mais sobre o que está te sobrecarregando?",
    "Seu corpo e mente estão pedindo descanso, e isso não é fraqueza — é sabedoria. 🧘‍♀️ Burnout não se resolve com força de vontade, mas com mudanças reais de rotina. Sugiro três coisas: 1) Estabeleça um horário fixo para dormir e acordar, 2) Faça pausas de verdade durante o dia (sem celular), 3) Reserve 30 minutos diários para algo que você ama, sem culpa. Como está sua rotina atual?",
  ],
  sleep: [
    "Dormir bem é a base de tudo! 🌙 Algumas dicas práticas: evite telas 1h antes de dormir (a luz azul atrapalha a melatonina), mantenha o quarto escuro e fresco, e tente dormir e acordar sempre nos mesmos horários — inclusive nos fins de semana. O Flowise pode te ajudar a registrar sua rotina de sono. Como tem sido suas noites?",
    "Sono de qualidade é um superpoder subestimado. 😴 Sabe o que ajuda muito? Criar um ritual de desaceleração: 30 minutos antes de dormir, faça algo relaxante como ler um livro físico, tomar um chá sem cafeína, ou escrever num diário. Nada de redes sociais! Que tal experimentar essa noite?",
  ],
  default: [
    "Obrigado por compartilhar isso comigo. 💚 Cada pessoa tem sua jornada única, e estou aqui para caminhar ao seu lado. Me conte um pouco mais sobre o que está sentindo — quanto mais eu souber, melhor posso te apoiar.",
    "Que interessante você trazer isso! 🤔 Me ajuda a entender melhor: como essa situação tem impactado seu dia a dia? E o que você já tentou fazer a respeito?",
  ],
};

function detectIntent(message) {
  const lower = message.toLowerCase();

  if (/^(oi|olá|ola|hey|ei|e aí|e ai|bom dia|boa tarde|boa noite|iae|salve|fala|opa)[!,. ]*$/i.test(lower.trim())) {
    return "greeting";
  }
  if (/foco|concentr|produt|pomodoro|timer|distra|render|focar|concentracao/i.test(lower)) {
    return "focus";
  }
  if (/ansied|ansioso|ansiosa|nervos|preocup|medo|panico|pânico|estress/i.test(lower)) {
    return "anxiety";
  }
  if (/burnout|esgotad|exaust|exausto|cansad|sobrecarga|sem energia|esgotamento/i.test(lower)) {
    return "burnout";
  }
  if (/sono|dormir|insônia|insonia|cansado|descans|noite|dorm/i.test(lower)) {
    return "sleep";
  }
  return "default";
}

function generateResponse(message, intent) {
  const responses = INTENT_RESPONSES[intent] || INTENT_RESPONSES.default;
  const idx = Math.floor(Math.random() * responses.length);
  return responses[idx];
}

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return Response.json(
        { error: "Mensagem vazia. Por favor, digite algo." },
        { status: 400 }
      );
    }

    // Simula um pequeno delay para parecer natural
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));

    const intent = detectIntent(message);
    const reply = generateResponse(message, intent);

    return Response.json({
      reply,
      intent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro na API de chat:", error);
    return Response.json(
      { error: "Desculpe, ocorreu um erro interno. Tente novamente." },
      { status: 500 }
    );
  }
}