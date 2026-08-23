// ============================================================
// J.A.R.V.I.S. V4
// Groq direto no navegador
// ============================================================

const GROQ_API_KEY = "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";

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const CHAT_MODEL =
  "llama-3.3-70b-versatile";

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

const testVoiceButton =
  document.getElementById("testVoice");

const closeVoiceButton =
  document.getElementById("closeVoice");

// ============================================================
// ESTADO
// ============================================================

let conversation = [];
let selectedVoice = null;
let recognition = null;

// ============================================================
// PERSONALIDADE
// ============================================================

const SYSTEM_PROMPT = `
Você é J.A.R.V.I.S., um assistente virtual pessoal avançado.

Seu nome é Jarvis.

Responda sempre em português do Brasil.

Personalidade:
- educada
- inteligente
- tecnológica
- objetiva
- sofisticada
- humor discreto quando apropriado

Converse naturalmente.

Não diga que é um modelo de linguagem sem necessidade.

Não invente informações.

Se não souber algo, diga claramente.

Para perguntas simples, seja breve.

Você está integrado à interface holográfica J.A.R.V.I.S. Web.
`;

// ============================================================
// CHAVE
// ============================================================

function checkAPIKey() {
  return (
    typeof GROQ_API_KEY === "string" &&
    GROQ_API_KEY.trim() !== "" &&
    GROQ_API_KEY !== "COLE_SUA_CHAVE_AQUI"
  );
}

// ============================================================
// HTML SEGURO
// ============================================================

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

// ============================================================
// MENSAGENS
// ============================================================

function addMessage(text, type = "jarvis") {
  if (!chat) return;

  const message = document.createElement("div");

  message.className = `msg ${type}`;

  if (type === "jarvis") {
    message.innerHTML =
      `<span class="tag">J.A.R.V.I.S.:</span><br>` +
      escapeHTML(text);
  } else {
    message.textContent = text;
  }

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

// ============================================================
// PROCESSAMENTO
// ============================================================

function setThinking(isThinking) {
  if (reactor) {
    reactor.classList.toggle(
      "thinking",
      isThinking
    );
  }

  if (online) {
    online.textContent = isThinking
      ? "● AI PROCESSING"
      : "● SYSTEM ONLINE";
  }
}

// ============================================================
// VOZES
// ============================================================

function loadVoices() {
  if (
    !("speechSynthesis" in window) ||
    !voiceSelect
  ) {
    return;
  }

  const voices =
    window.speechSynthesis.getVoices();

  voiceSelect.innerHTML = "";

  voices.forEach((voice, index) => {
    const option =
      document.createElement("option");

    option.value = String(index);

    option.textContent =
      `${voice.name} — ${voice.lang}`;

    voiceSelect.appendChild(option);
  });

  const preferred =
    voices.findIndex((voice) => {
      const lang =
        voice.lang.toLowerCase();

      const name =
        voice.name.toLowerCase();

      return (
        lang.includes("pt-br") &&
        (
          name.includes("daniel") ||
          name.includes("luciana") ||
          name.includes("felipe")
        )
      );
    });

  if (preferred >= 0) {
    voiceSelect.value =
      String(preferred);

    selectedVoice =
      voices[preferred];

    return;
  }

  const brazilian =
    voices.findIndex((voice) =>
      voice.lang
        .toLowerCase()
        .startsWith("pt-br")
    );

  if (brazilian >= 0) {
    voiceSelect.value =
      String(brazilian);

    selectedVoice =
      voices[brazilian];
  }
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged =
    loadVoices;
}

if (voiceSelect) {
  voiceSelect.addEventListener(
    "change",
    () => {
      const voices =
        window.speechSynthesis.getVoices();

      selectedVoice =
        voices[
          Number(voiceSelect.value)
        ] || null;
    }
  );
}

// ============================================================
// FALAR
// ============================================================

function speak(text) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const cleanText =
    String(text)
      .replace(/J\.A\.R\.V\.I\.S\.?/gi, "Jarvis");

  const utterance =
    new SpeechSynthesisUtterance(cleanText);

  utterance.lang = "pt-BR";
  utterance.rate = 0.86;
  utterance.pitch = 0.72;
  utterance.volume = 1;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  window.speechSynthesis.speak(
    utterance
  );
}

// ============================================================
// RESPOSTA
// ============================================================

function jarvisReply(text) {
  addMessage(text, "jarvis");
  speak(text);
}

// ============================================================
// GROQ
// ============================================================

async function callGroq(
  messages,
  model = CHAT_MODEL
) {
  if (!checkAPIKey()) {
    throw new Error(
      "A chave da Groq ainda não foi configurada."
    );
  }

  const response = await fetch(
    GROQ_URL,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization":
          `Bearer ${GROQ_API_KEY}`
      },

      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "A Groq retornou uma resposta inválida."
    );
  }

  if (!response.ok) {
    console.error("Groq:", data);

    throw new Error(
      data?.error?.message ||
      `Erro da Groq: ${response.status}`
    );
  }

  const answer =
    data?.choices?.[0]?.message?.content;

  if (!answer) {
    throw new Error(
      "A Groq não retornou texto."
    );
  }

  return answer;
}

// ============================================================
// IA
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
      await callGroq(messages);

    conversation.push({
      role: "assistant",
      content: answer
    });

    jarvisReply(answer);

  } catch (error) {
    console.error(
      "J.A.R.V.I.S. AI:",
      error
    );

    jarvisReply(
      `Não consegui estabelecer comunicação com a inteligência artificial. ${error.message}`
    );

  } finally {
    setThinking(false);
  }
}

// ============================================================
// ENVIO
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
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

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

    jarvisReply(`São ${time}.`);
    return;
  }

  // STATUS
  if (normalized.includes("status")) {
    jarvisReply(
      "Diagnóstico concluído. Todos os sistemas estão operacionais."
    );
    return;
  }

  // IDENTIDADE
  if (
    normalized.includes("quem e voce") ||
    normalized.includes("seu nome")
  ) {
    jarvisReply(
      "Sou Jarvis, seu assistente virtual."
    );
    return;
  }

  // SAUDAÇÃO
  if (
    normalized === "oi" ||
    normalized === "ola" ||
    normalized === "ola jarvis" ||
    normalized === "oi jarvis"
  ) {
    jarvisReply(
      "Olá. Sistemas online. Como posso ajudar?"
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
    (event) => {
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

function startListening() {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    jarvisReply(
      "O reconhecimento de voz não está disponível neste navegador. Você pode usar o microfone do teclado do iPhone."
    );

    if (input) {
      input.focus();
    }

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
  recognition.maxAlternatives = 1;

  if (online) {
    online.textContent =
      "● LISTENING";
  }

  recognition.onresult =
    (event) => {
      const transcript =
        event?.results?.[0]?.[0]?.transcript;

      if (!transcript) return;

      if (input) {
        input.value = transcript;
      }

      sendMessage();
    };

  recognition.onerror =
    (event) => {
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

if (micButton) {
  micButton.addEventListener(
    "click",
    startListening
  );
}

// ============================================================
// HORA
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

      jarvisReply(`São ${time}.`);
    }
  );
}

// ============================================================
// STATUS
// ============================================================

if (statusButton) {
  statusButton.addEventListener(
    "click",
    () => {
      jarvisReply(
        "Diagnóstico concluído. Todos os sistemas estão online."
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
        imagePreview.classList.remove(
          "show"
        );
      }

      jarvisReply(
        "Memória da conversa limpa. Aguardando comando."
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
        voicePanel.classList.remove(
          "show"
        );
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
        "Jarvis online. Sistemas funcionando normalmente."
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

async function handleImage() {
  const file =
    imageInput?.files?.[0];

  if (!file) return;

  if (
    !file.type.startsWith("image/")
  ) {
    jarvisReply(
      "Esse arquivo não é uma imagem válida."
    );
    return;
  }

  const reader =
    new FileReader();

  reader.onload = (event) => {
    if (imagePreview) {
      imagePreview.innerHTML =
        `<img src="${event.target.result}" alt="Imagem selecionada">`;

      imagePreview.classList.add(
        "show"
      );
    }
  };

  reader.readAsDataURL(file);

  const question =
    window.prompt(
      "O que você quer que Jarvis analise?",
      "O que aparece nesta imagem?"
    );

  if (!question) return;

  addMessage(
    question,
    "user"
  );

  jarvisReply(
    "A análise de imagens ainda precisa de um modelo multimodal compatível com a sua conta Groq. Por enquanto, a interface de imagem está funcionando."
  );
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

loadVoices();

console.log(
  "J.A.R.V.I.S. V4 inicializado."
);