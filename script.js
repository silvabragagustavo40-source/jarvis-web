// ============================================================
// J.A.R.V.I.S. V4
// Groq direto no navegador
// ============================================================

const GROQ_API_KEY = "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";

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const CHAT_MODEL =
  "llama-3.3-70b-versatile";

const VISION_MODEL =
  "meta-llama/llama-4-scout-17b-16e-instruct";


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

Seu nome é Jarvis.

Responda sempre em português do Brasil.

Sua personalidade:
- educada
- inteligente
- tecnológica
- objetiva
- sofisticada
- humor discreto quando apropriado

Converse naturalmente.

Não invente informações.

Quando não souber algo, diga claramente que não sabe.

Mantenha respostas relativamente curtas quando a pergunta for simples.

Você está integrado a uma interface holográfica chamada J.A.R.V.I.S. Web.
`;


// ============================================================
// VERIFICAR API
// ============================================================

function checkAPIKey() {

  if (
    !GROQ_API_KEY ||
    GROQ_API_KEY === "COLE_SUA_NOVA_CHAVE_AQUI"
  ) {
    return false;
  }

  return true;
}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    String(text);

  return div.innerHTML;
}


// ============================================================
// MENSAGEM
// ============================================================

function addMessage(
  text,
  type = "jarvis"
) {

  if (!chat) return;

  const message =
    document.createElement("div");

  message.className =
    "msg " + type;

  if (type === "jarvis") {

    message.innerHTML =
      `<span class="tag">J.A.R.V.I.S.:</span><br>${escapeHTML(text)}`;

  } else {

    message.textContent =
      text;
  }

  chat.appendChild(message);

  chat.scrollTop =
    chat.scrollHeight;
}


// ============================================================
// STATUS
// ============================================================

function setThinking(isThinking) {

  if (reactor) {

    reactor.classList.toggle(
      "thinking",
      isThinking
    );
  }

  if (online) {

    online.textContent =
      isThinking
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
    speechSynthesis.getVoices();

  voiceSelect.innerHTML = "";

  voices.forEach(
    (voice, index) => {

      const option =
        document.createElement("option");

      option.value =
        index;

      option.textContent =
        `${voice.name} — ${voice.lang}`;

      voiceSelect.appendChild(option);
    }
  );

  const preferred =
    voices.findIndex(
      voice => {

        const language =
          voice.lang.toLowerCase();

        return (
          language.includes("pt-br") ||
          language.includes("pt_br")
        );
      }
    );

  if (preferred >= 0) {

    voiceSelect.value =
      preferred;

    selectedVoice =
      voices[preferred];
  }
}


if ("speechSynthesis" in window) {

  speechSynthesis.onvoiceschanged =
    loadVoices;
}

setTimeout(
  loadVoices,
  500
);


if (voiceSelect) {

  voiceSelect.addEventListener(
    "change",
    () => {

      const voices =
        speechSynthesis.getVoices();

      selectedVoice =
        voices[
          Number(
            voiceSelect.value
          )
        ];
    }
  );
}


// ============================================================
// FALAR
// ============================================================

function speak(text) {

  if (
    !("speechSynthesis" in window)
  ) {
    return;
  }

  speechSynthesis.cancel();

  const cleanText =
    String(text)
      .replace(
        /J\.A\.R\.V\.I\.S\.?/gi,
        "Jarvis"
      );

  const utterance =
    new SpeechSynthesisUtterance(
      cleanText
    );

  utterance.lang =
    "pt-BR";

  utterance.rate =
    0.86;

  utterance.pitch =
    0.72;

  utterance.volume =
    1;

  if (selectedVoice) {

    utterance.voice =
      selectedVoice;
  }

  speechSynthesis.speak(
    utterance
  );
}


function jarvisReply(text) {

  addMessage(
    text,
    "jarvis"
  );

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
      "A chave da Groq ainda não foi colocada."
    );
  }

  const response =
    await fetch(
      GROQ_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${GROQ_API_KEY}`
        },

        body:
          JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1000
          })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    console.error(
      "Erro Groq:",
      data
    );

    throw new Error(
      data.error?.message ||
      "A Groq retornou um erro."
    );
  }

  return (
    data.choices?.[0]?.message?.content ||
    "Não consegui gerar uma resposta."
  );
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

    if (
      conversation.length > 12
    ) {

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

    console.error(error);

    jarvisReply(
      "Não consegui estabelecer comunicação com a inteligência artificial. Verifique a chave da Groq e sua conexão."
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

  addMessage(
    text,
    "user"
  );

  input.value = "";

  const normalized =
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  if (
    normalized.includes("hora")
  ) {

    const time =
      new Date()
        .toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );

    jarvisReply(
      `São ${time}.`
    );

    return;
  }

  if (
    normalized.includes("status")
  ) {

    jarvisReply(
      "Diagnóstico concluído. Todos os sistemas estão operacionais."
    );

    return;
  }

  if (
    normalized.includes("quem e voce") ||
    normalized.includes("seu nome")
  ) {

    jarvisReply(
      "Sou Jarvis, seu assistente virtual."
    );

    return;
  }

  if (
    normalized === "oi" ||
    normalized === "ola"
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
    event => {

      if (
        event.key === "Enter"
      ) {

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

    addMessage(
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

  recognition.lang =
    "pt-BR";

  recognition.continuous =
    false;

  recognition.interimResults =
    false;

  if (online) {

    online.textContent =
      "● LISTENING";
  }

  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0].transcript;

      if (input) {

        input.value =
          transcript;
      }

      sendMessage();
    };

  recognition.onerror =
    event => {

      console.log(
        "Microfone:",
        event.error
      );

      if (online) {

        online.textContent =
          "● SYSTEM ONLINE";
      }
    };

  recognition.onend =
    () => {

      if (online) {

        online.textContent =
          "● SYSTEM ONLINE";
      }
    };

  try {

    recognition.start();

  } catch (error) {

    console.error(error);
  }
}


// ============================================================
// HORA
// ============================================================

if (timeButton) {

  timeButton.addEventListener(
    "click",
    () => {

      const time =
        new Date()
          .toLocaleTimeString(
            "pt-BR",
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          );

      jarvisReply(
        `São ${time}.`
      );
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

        imagePreview.innerHTML =
          "";

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

        voicePanel.classList.add(
          "show"
        );
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
// TESTAR VOZ
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
// IMAGENS
// ============================================================

if (imageInput) {

  imageInput.addEventListener(
    "change",
    handleImage
  );
}


async function handleImage() {

  const file =
    imageInput.files?.[0];

  if (!file) {
    return;
  }

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

  reader.onload =
    event => {

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

  if (!question) {
    return;
  }

  addMessage(
    question,
    "user"
  );

  setThinking(true);

  try {

    const base64 =
      await fileToBase64(file);

    const imageData =
      base64.split(",")[1];

    const messages = [
      {
        role: "system",
        content:
          SYSTEM_PROMPT +
          "\nVocê também pode analisar imagens."
      },

      {
        role: "user",

        content: [
          {
            type: "text",
            text: question
          },

          {
            type: "image_url",

            image_url: {
              url:
                `data:${file.type};base64,${imageData}`
            }
          }
        ]
      }
    ];

    const answer =
      await callGroq(
        messages,
        VISION_MODEL
      );

    jarvisReply(answer);

  } catch (error) {

    console.error(error);

    jarvisReply(
      "Não consegui analisar essa imagem. Verifique sua conexão e a configuração da API."
    );

  } finally {

    setThinking(false);
  }
}


// ============================================================
// BASE64
// ============================================================

function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => {

          resolve(
            reader.result
          );
        };

      reader.onerror =
        () => {

          reject(
            new Error(
              "Não foi possível ler a imagem."
            )
          );
        };

      reader.readAsDataURL(file);
    }
  );
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

loadVoices();

console.log(
  "J.A.R.V.I.S. V4 inicializado."
);