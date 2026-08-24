// ============================================================
// J.A.R.V.I.S. V4
// public/script.js
// Comunicação através de /api/chat
// ============================================================

const API_URL = "/api/chat";

// ============================================================
// ELEMENTOS DA INTERFACE
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
// PERSONALIDADE DO J.A.R.V.I.S.
// ============================================================

const SYSTEM_PROMPT = `
Você é J.A.R.V.I.S., um assistente virtual pessoal avançado.

Seu nome é Jarvis.

Responda sempre em português do Brasil.

Sua personalidade:
- educada
- inteligente
- tecnológica
- objetiva
- levemente sofisticada
- com humor discreto quando apropriado

Converse naturalmente.

Não invente informações.

Quando não souber algo, diga claramente que não sabe.

Mantenha respostas relativamente curtas quando a pergunta for simples.

Você está integrado a uma interface holográfica chamada J.A.R.V.I.S. Web.
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
// STATUS / REATOR
// ============================================================

function setThinking(isThinking) {
  if (reactor) {
    reactor.classList.toggle("thinking", isThinking);
  }

  if (online) {
    online.textContent = isThinking
      ? "● AI PROCESSING"
      : "● SYSTEM ONLINE";
  }
}

// ============================================================
// SISTEMA DE VOZ
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

  const preferred = voices.findIndex((voice) => {
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

  const brazilian = voices.findIndex((voice) =>
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
  if (!("speechSynthesis" in window)) {
    return;
  }

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
// RESPOSTA DO JARVIS
// ============================================================

function jarvisReply(text) {
  addMessage(text, "jarvis");
  speak(text);
}

// ============================================================
// COMUNICAÇÃO COM A API
// ============================================================

async function callAPI(messages) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      messages: messages
    })
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "A API retornou uma resposta inválida."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      "Erro ao comunicar com a API."
    );
  }

  return (
    data?.answer ||
    "Não recebi uma resposta da inteligência artificial."
  );
}

// ============================================================
// CONVERSA COM A IA
// ============================================================

async function askAI(text) {
  setThinking(true);

  try {
    conversation.push({
      role: "user",
      content: text
    });

    if (conversation.length > 12) {
      conversation = conversation.slice(-12);
    }

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      ...conversation
    ];

    const answer = await callAPI(messages);

    conversation.push({
      role: "assistant",
      content: answer
    });

    jarvisReply(answer);

  } catch (error) {
    console.error("J.A.R.V.I.S. API:", error);

    jarvisReply(
      "Não consegui estabelecer comunicação com a inteligência artificial. Verifique a configuração da API."
    );

  } finally {
    setThinking(false);
  }
}

// ============================================================
// ENVIO DE MENSAGEM
// ============================================================

async function sendMessage() {
  if (!input) return;

  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");

  input.value = "";

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // ==========================================================
  // HORA
  // ==========================================================

  if (normalized.includes("hora")) {
    const time = new Date().toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

    jarvisReply(`São ${time}.`);
    return;
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  if (normalized.includes("status")) {
    jarvisReply(
      "Diagnóstico concluído. Todos os sistemas estão operacionais."
    );

    return;
  }

  // ==========================================================
  // IDENTIDADE
  // ==========================================================

  if (
    normalized.includes("quem e voce") ||
    normalized.includes("seu nome")
  ) {
    jarvisReply(
      "Sou Jarvis, seu assistente virtual."
    );

    return;
  }

  // ==========================================================
  // SAUDAÇÃO
  // ==========================================================

  if (
    normalized === "oi" ||
    normalized === "ola"
  ) {
    jarvisReply(
      "Olá. Sistemas online. Como posso ajudar?"
    );

    return;
  }

  // ==========================================================
  // IA
  // ==========================================================

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
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });
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
    if (input) {
      input.focus();
    }

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

  recognition = new SpeechRecognition();

  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = false;

  if (online) {
    online.textContent = "● LISTENING";
  }

  recognition.onresult = (event) => {
    const transcript =
      event.results[0][0].transcript;

    if (input) {
      input.value = transcript;
    }

    sendMessage();
  };

  recognition.onerror = (event) => {
    console.log(
      "Microfone:",
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
      "Erro ao iniciar microfone:",
      error
    );
  }
}

// ============================================================
// BOTÃO HORA
// ============================================================

if (timeButton) {
  timeButton.addEventListener("click", () => {
    const time = new Date().toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

    jarvisReply(`São ${time}.`);
  });
}

// ============================================================
// BOTÃO STATUS
// ============================================================

if (statusButton) {
  statusButton.addEventListener("click", () => {
    jarvisReply(
      "Diagnóstico concluído. Todos os sistemas estão online."
    );
  });
}

// ============================================================
// LIMPAR CONVERSA
// ============================================================

if (clearButton) {
  clearButton.addEventListener("click", () => {
    if (chat) {
      chat.innerHTML = "";
    }

    conversation = [];

    if (imagePreview) {
      imagePreview.innerHTML = "";
      imagePreview.classList.remove("show");
    }

    jarvisReply(
      "Memória da conversa limpa. Aguardando comando."
    );
  });
}

// ============================================================
// PAINEL DE VOZ
// ============================================================

if (voiceButton) {
  voiceButton.addEventListener("click", () => {
    loadVoices();

    if (voicePanel) {
      voicePanel.classList.add("show");
    }
  });
}

if (closeVoiceButton) {
  closeVoiceButton.addEventListener("click", () => {
    if (voicePanel) {
      voicePanel.classList.remove("show");
    }
  });
}

// ============================================================
// TESTAR VOZ
// ============================================================

if (testVoiceButton) {
  testVoiceButton.addEventListener("click", () => {
    speak(
      "Jarvis online. Sistemas funcionando normalmente."
    );
  });
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

async function handleImage() {
  const file = imageInput.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    jarvisReply(
      "Esse arquivo não é uma imagem válida."
    );

    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    if (imagePreview) {
      imagePreview.innerHTML =
        `<img src="${event.target.result}" alt="Imagem selecionada">`;

      imagePreview.classList.add("show");
    }
  };

  reader.readAsDataURL(file);

  jarvisReply(
    "Imagem recebida. A análise de imagens será configurada na próxima etapa."
  );
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

loadVoices();

console.log(
  "J.A.R.V.I.S. V4 inicializado."
);