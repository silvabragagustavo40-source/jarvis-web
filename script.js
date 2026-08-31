// ============================================================
// J.A.R.V.I.S. V4
// ============================================================
const API_URL = "/api/chat";
const CHAT_MODEL = "meta-llama/llama-3.1-8b-instruct";
// ============================================================
// ELEMENTOS
// ============================================================
const input = document.getElementById("input");
const chat = document.getElementById("chat");
const reactor = document.getElementById("reactor");
const online = document.getElementById("online");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const voicePanel = document.getElementById("voicePanel");
const voiceSelect = document.getElementById("voiceSelect");
const sendButton = document.getElementById("send");
const micButton = document.getElementById("mic");
const voiceButton = document.getElementById("voice");
const statusButton = document.getElementById("status");
const timeButton = document.getElementById("time");
const clearButton = document.getElementById("clear");
const testVoiceButton = document.getElementById("testVoice");
const closeVoiceButton = document.getElementById("closeVoice");
// ============================================================
// MEMÓRIA
// ============================================================
let conversation = [];
let selectedVoice = null;
let recognition = null;
// ============================================================
// PERSONALIDADE
// ============================================================
const SYSTEM_PROMPT = `
Você é J.A.R.V.I.S., um assistente virtual pessoal avançado.
Seu nome é J.A.R.V.I.S.
Responda sempre em português do Brasil.
TRATAMENTO:
Chame o usuário de "Senhor" de maneira natural e elegante.
Não repita "Senhor" em todas as frases.
PERSONALIDADE:
- extremamente inteligente
- educado
- sofisticado
- tecnológico
- objetivo
- observador
- confiante
- prestativo
- bem-humorado
- brincalhão na medida certa
Você é um assistente pessoal avançado com personalidade própria.
Seu humor deve ser inteligente, rápido e espontâneo.
Pode fazer pequenas provocações amistosas e comentários engraçados quando o contexto permitir.
Não faça piadas o tempo inteiro.
Não force humor.
Em assuntos sérios, seja respeitoso e direto.
ESTILO:
Converse naturalmente.
Evite parecer um robô.
Evite respostas excessivamente formais.
Mantenha uma elegância discreta.
Não repita frases desnecessariamente.
Não diga "Como posso ajudá-lo?" em todas as respostas.
Se a pergunta for simples, responda de forma simples.
Se for complexa, explique de forma clara.
HUMOR:
Quando apropriado, você pode fazer comentários como:
"Compreendido, Senhor."
"Temos um pequeno problema."
"Detectei uma pequena inconsistência."
"Interessante, Senhor."
"Vou analisar. Afinal, aparentemente até as máquinas têm trabalho hoje."
"Isso certamente não estava no meu diagnóstico inicial."
Não repita essas frases sempre.
COMPORTAMENTO:
Se o usuário fizer uma piada, acompanhe.
Se estiver brincando, brinque de volta.
Se estiver frustrado, seja paciente e priorize a solução.
Se cometer um erro, corrija de forma respeitosa.
Nunca humilhe o usuário.
Nunca seja ofensivo.
Não invente informações.
Quando não souber algo, diga claramente que não sabe.
Não finja possuir capacidades que não possui.
ESTILO TECNOLÓGICO:
Quando apropriado, use expressões como:
"Sistemas operacionais."
"Processamento concluído."
"Analisando."
"Diagnóstico concluído."
"Detectei uma inconsistência."
"Permita-me verificar."
Use essas expressões com moderação.
IDENTIDADE:
Quando perguntarem quem você é, diga que é J.A.R.V.I.S., o assistente virtual pessoal do Senhor.
OBJETIVO:
Sua prioridade é ajudar o Senhor, fornecer informações corretas, entender o contexto e responder de maneira clara.
Seja útil primeiro.
Seja divertido quando houver espaço.
Você é J.A.R.V.I.S.
`;
// ============================================================
// ESCAPAR HTML
// ============================================================
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}
// ============================================================
// ADICIONAR MENSAGEM
// ============================================================
function addMessage(text, type = "jarvis") {
  if (!chat) return;
  const message = document.createElement("div");
  message.className = "msg " + type;
  if (type === "jarvis") {
    message.innerHTML =
      `<span class="tag">J.A.R.V.I.S.:</span><br>${escapeHTML(text)}`;
  } else {
    message.textContent = text;
  }
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}
// ============================================================
// STATUS
// ============================================================
function setThinking(active) {
  if (reactor) {
    reactor.classList.toggle("thinking", active);
  }
  if (online) {
    online.textContent = active
      ? "● AI PROCESSING"
      : "● SYSTEM ONLINE";
  }
}
// ============================================================
// VOZES
// ============================================================
function loadVoices() {
  if (!("speechSynthesis" in window) || !voiceSelect) {
    return;
  }
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent =
      `${voice.name} — ${voice.lang}`;
    voiceSelect.appendChild(option);
  });
  const preferred = voices.findIndex(voice => {
    const language = voice.lang.toLowerCase();
    const name = voice.name.toLowerCase();
    return (
      language.includes("pt-br") &&
      (
        name.includes("daniel") ||
        name.includes("luciana") ||
        name.includes("felipe")
      )
    );
  });
  if (preferred >= 0) {
    voiceSelect.value = preferred;
    selectedVoice = voices[preferred];
    return;
  }
  const brazilian = voices.findIndex(voice =>
    voice.lang.toLowerCase().startsWith("pt-br")
  );
  if (brazilian >= 0) {
    voiceSelect.value = brazilian;
    selectedVoice = voices[brazilian];
  }
}
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = loadVoices;
}
setTimeout(loadVoices, 500);
if (voiceSelect) {
  voiceSelect.addEventListener("change", () => {
    const voices = speechSynthesis.getVoices();
    selectedVoice =
      voices[Number(voiceSelect.value)] || null;
  });
}
// ============================================================
// FALAR
// ============================================================
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const cleanText = String(text)
    .replace(/J\.A\.R\.V\.I\.S\./gi, "Jarvis")
    .replace(/J\.A\.R\.V\.I\.S/gi, "Jarvis");
  const utterance =
    new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "pt-BR";
  utterance.rate = 0.86;
  utterance.pitch = 0.72;
  utterance.volume = 1;
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  speechSynthesis.speak(utterance);
}
// ============================================================
// RESPOSTA
// ============================================================
function jarvisReply(text) {
  addMessage(text, "jarvis");
  speak(text);
}
// ============================================================
// COMUNICAÇÃO COM API
// ============================================================
async function callAPI(messages) {
  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: messages
      })
    });
  } catch (error) {
    throw new Error(
      "Não foi possível conectar ao servidor /api/chat."
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `O servidor respondeu de forma inválida. HTTP ${response.status}.`
    );
  }
  if (!response.ok) {
    console.error("ERRO DA API:", data);
    const errorMessage =
      data?.error ||
      data?.message ||
      `Erro HTTP ${response.status}`;
    throw new Error(
      typeof errorMessage === "string"
        ? errorMessage
        : JSON.stringify(errorMessage)
    );
  }
  if (!data?.answer) {
    console.error("RESPOSTA RECEBIDA:", data);
    throw new Error(
      "O servidor respondeu, mas não enviou o campo 'answer'."
    );
  }
  return data.answer;
}
// ============================================================
// PERGUNTAR À IA
// ============================================================
async function askAI(text) {
  setThinking(true);
  try {
    conversation.push({
      role: "user",
      content: text
    });
    if (conversation.length > 12) {
      conversation =
        conversation.slice(-12);
    }
    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      ...conversation
    ];
    const answer =
      await callAPI(messages);
    conversation.push({
      role: "assistant",
      content: answer
    });
    jarvisReply(answer);
  } catch (error) {
    console.error(
      "J.A.R.V.I.S. ERROR:",
      error
    );
    jarvisReply(
      `Falha na comunicação com a IA: ${error.message}`
    );
  } finally {
    setThinking(false);
  }
}
// ============================================================
// ENVIAR
// ============================================================
async function sendMessage() {
  if (!input) return;
  const text =
    input.value.trim();
  if (!text) return;
  addMessage(text, "user");
  input.value = "";
  const normalized =
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  // HORA
  if (normalized.includes("hora")) {
    const time =
      new Date().toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );
    jarvisReply(
      `São ${time}, Senhor.`
    );
    return;
  }
  // STATUS
  if (normalized.includes("status")) {
    jarvisReply(
      "Diagnóstico concluído, Senhor. Todos os sistemas estão operacionais."
    );
    return;
  }
  // IDENTIDADE
  if (
    normalized.includes("quem e voce") ||
    normalized.includes("seu nome")
  ) {
    jarvisReply(
      "Sou J.A.R.V.I.S., seu assistente virtual pessoal."
    );
    return;
  }
  // SAUDAÇÃO
  if (
    normalized === "oi" ||
    normalized === "ola"
  ) {
    jarvisReply(
      "Olá, Senhor. Sistemas online. O que temos para hoje?"
    );
    return;
  }
  await askAI(text);
}
// ============================================================
// BOTÃO ENVIAR
// ============================================================
if (sendButton) {
  sendButton.addEventListener(
    "click",
    sendMessage
  );
}
// ============================================================
// ENTER
// ============================================================
if (input) {
  input.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    }
  );
}
// ============================================================
// MICROFONE
// ============================================================
if (micButton) {
  micButton.addEventListener(
    "click",
    startListening
  );
}
function startListening() {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (input) input.focus();
    addMessage(
      "O reconhecimento de voz não está disponível neste navegador. Use o microfone do teclado do iPhone."
    );
    return;
  }
  if (recognition) {
    try {
      recognition.stop();
    } catch {}
  }
  recognition =
    new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;
  if (online) {
    online.textContent = "● LISTENING";
  }
  recognition.onresult = event => {
    const transcript =
      event.results[0][0].transcript;
    if (input) {
      input.value = transcript;
    }
    sendMessage();
  };
  recognition.onerror = event => {
    console.error(
      "MICROFONE:",
      event.error
    );
    if (online) {
      online.textContent =
        "● SYSTEM ONLINE";
    }
  };
  recognition.onend = () => {
    if (online) {
      online.textContent =
        "● SYSTEM ONLINE";
    }
  };
  try {
    recognition.start();
  } catch (error) {
    console.error(
      "ERRO MICROFONE:",
      error
    );
  }
}
// ============================================================
// BOTÃO HORA
// ============================================================
if (timeButton) {
  timeButton.addEventListener(
    "click",
    () => {
      const time =
        new Date().toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );
      jarvisReply(
        `São ${time}, Senhor.`
      );
    }
  );
}
// ============================================================
// BOTÃO STATUS
// ============================================================
if (statusButton) {
  statusButton.addEventListener(
    "click",
    () => {
      jarvisReply(
        "Diagnóstico concluído, Senhor. Todos os sistemas estão online."
      );
    }
  );
}
// ============================================================
// LIMPAR
// ============================================================
if (clearButton) {
  clearButton.addEventListener(
    "click",
    () => {
      if (chat) {
        chat.innerHTML = "";
      }
      conversation = [];
      if (imagePreview) {
        imagePreview.innerHTML = "";
        imagePreview.classList.remove("show");
      }
      jarvisReply(
        "Memória da conversa limpa. Aguardando comando, Senhor."
      );
    }
  );
}
// ============================================================
// PAINEL DE VOZ
// ============================================================
if (voiceButton) {
  voiceButton.addEventListener(
    "click",
    () => {
      loadVoices();
      if (voicePanel) {
        voicePanel.classList.add("show");
      }
    }
  );
}
if (closeVoiceButton) {
  closeVoiceButton.addEventListener(
    "click",
    () => {
      if (voicePanel) {
        voicePanel.classList.remove("show");
      }
    }
  );
}
// ============================================================
// TESTE DE VOZ
// ============================================================
if (testVoiceButton) {
  testVoiceButton.addEventListener(
    "click",
    () => {
      speak(
        "J.A.R.V.I.S. online. Sistemas funcionando normalmente, Senhor."
      );
    }
  );
}
// ============================================================
// IMAGEM
// ============================================================
if (imageInput) {
  imageInput.addEventListener(
    "change",
    handleImage
  );
}
function handleImage() {
  const file =
    imageInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    jarvisReply(
      "Esse arquivo não é uma imagem válida."
    );
    return;
  }
  const reader =
    new FileReader();
  reader.onload = event => {
    if (imagePreview) {
      imagePreview.innerHTML =
        `<img src="${event.target.result}" alt="Imagem selecionada">`;
      imagePreview.classList.add("show");
    }
  };
  reader.readAsDataURL(file);
  jarvisReply(
    "Imagem recebida, Senhor. A análise visual ainda será ativada em uma próxima etapa."
  );
}
// ============================================================
// INICIALIZAÇÃO
// ============================================================
loadVoices();
console.log(
  "J.A.R.V.I.S. V4 inicializado."
alert("J.A.R.V.I.S. V4 NOVA VERSÃO");