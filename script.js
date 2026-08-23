const API_URL = "/api/chat";

const input = document.getElementById("input");
const chat = document.getElementById("chat");
const reactor = document.getElementById("reactor");
const online = document.getElementById("online");

const sendButton = document.getElementById("send");
const micButton = document.getElementById("mic");

let conversation = [];

const SYSTEM_PROMPT = `
Você é J.A.R.V.I.S., um assistente virtual pessoal avançado.

Responda sempre em português do Brasil.

Personalidade:
- educado
- inteligente
- tecnológico
- objetivo
- sofisticado
- humor discreto quando apropriado

Não invente informações.
Se não souber algo, diga claramente.
Para perguntas simples, seja breve.

Você está integrado à interface holográfica J.A.R.V.I.S. Web.
`;

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

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

function setThinking(value) {
  if (reactor) {
    reactor.classList.toggle("thinking", value);
  }

  if (online) {
    online.textContent = value
      ? "● AI PROCESSING"
      : "● SYSTEM ONLINE";
  }
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const voice = new SpeechSynthesisUtterance(
    String(text)
  );

  voice.lang = "pt-BR";
  voice.rate = 0.86;
  voice.pitch = 0.72;
  voice.volume = 1;

  speechSynthesis.speak(voice);
}

function jarvisReply(text) {
  addMessage(text, "jarvis");
  speak(text);
}

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

    const response = await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "Erro na comunicação com a IA."
      );
    }

    const answer =
      data?.answer ||
      "Não recebi uma resposta da inteligência artificial.";

    conversation.push({
      role: "assistant",
      content: answer
    });

    jarvisReply(answer);

  } catch (error) {

    console.error(
      "J.A.R.V.I.S.:",
      error
    );

    jarvisReply(
      "Não consegui estabelecer comunicação com a inteligência artificial. " +
      error.message
    );

  } finally {
    setThinking(false);
  }
}

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

  if (
    normalized === "oi" ||
    normalized === "ola" ||
    normalized === "oi jarvis" ||
    normalized === "ola jarvis"
  ) {
    jarvisReply(
      "Olá. Sistemas online. Como posso ajudar?"
    );

    return;
  }

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

  if (normalized.includes("status")) {
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
      "Sou J.A.R.V.I.S., seu assistente virtual."
    );

    return;
  }

  await askAI(text);
}

if (sendButton) {
  sendButton.addEventListener(
    "click",
    sendMessage
  );
}

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

if (micButton) {
  micButton.addEventListener(
    "click",
    () => {

      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        jarvisReply(
          "O reconhecimento de voz não está disponível neste navegador."
        );

        return;
      }

      const recognition =
        new SpeechRecognition();

      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      online.textContent =
        "● LISTENING";

      recognition.onresult =
        event => {

          input.value =
            event.results[0][0].transcript;

          sendMessage();
        };

      recognition.onend =
        () => {

          online.textContent =
            "● SYSTEM ONLINE";
        };

      recognition.onerror =
        () => {

          online.textContent =
            "● SYSTEM ONLINE";
        };

      recognition.start();
    }
  );
}

console.log(
  "J.A.R.V.I.S. V4 iniciado."
);