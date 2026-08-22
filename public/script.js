const input = document.getElementById("input");
const chat = document.getElementById("chat");
const reactor = document.getElementById("reactor");
const online = document.getElementById("online");

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");

const voicePanel = document.getElementById("voicePanel");
const voiceSelect = document.getElementById("voiceSelect");

let selectedVoice = null;
let conversation = [];


/* ==============================
   CHAT
============================== */

function add(text, who = "jarvis") {

  const div = document.createElement("div");

  div.className = "msg " + who;

  if (who === "jarvis") {

    div.innerHTML =
      `<span class="tag">J.A.R.V.I.S.:</span><br>${escapeHTML(text)}`;

  } else {

    div.textContent = text;

  }

  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;

  return div;
}


function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


/* ==============================
   VOZ
============================== */

function loadVoices() {

  if (!("speechSynthesis" in window)) {
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

    voiceSelect.value = preferred;

    selectedVoice =
      voices[preferred];

  }

  else {

    const brazilian =
      voices.findIndex(voice =>
        voice.lang
          .toLowerCase()
          .startsWith("pt-br")
      );

    if (brazilian >= 0) {

      voiceSelect.value =
        brazilian;

      selectedVoice =
        voices[brazilian];

    }

  }

}


if ("speechSynthesis" in window) {

  speechSynthesis.onvoiceschanged =
    loadVoices;

}

setTimeout(loadVoices, 500);


voiceSelect.onchange = () => {

  const voices =
    speechSynthesis.getVoices();

  selectedVoice =
    voices[
      Number(voiceSelect.value)
    ];

};


/* ==============================
   FALAR
============================== */

function speak(text) {

  if (!("speechSynthesis" in window)) {
    return;
  }

  speechSynthesis.cancel();


  /*
    Impede que o navegador
    soletre J.A.R.V.I.S.
  */

  let clean = text
    .replace(/J\.A\.R\.V\.I\.S\./gi, "Jarvis")
    .replace(/J\.A\.R\.V\.I\.S/gi, "Jarvis");


  const utterance =
    new SpeechSynthesisUtterance(clean);


  utterance.lang = "pt-BR";

  /*
    Voz mais grave e lenta.
  */

  utterance.rate = 0.86;

  utterance.pitch = 0.72;

  utterance.volume = 1;


  if (selectedVoice) {

    utterance.voice =
      selectedVoice;

  }


  speechSynthesis.speak(
    utterance
  );

}


function reply(text) {

  add(text);

  speak(text);

}


/* ==============================
   PENSANDO
============================== */

function setThinking(value) {

  if (value) {

    reactor.classList.add("thinking");

    online.textContent =
      "● AI PROCESSING";

  }

  else {

    reactor.classList.remove("thinking");

    online.textContent =
      "● SYSTEM ONLINE";

  }

}


/* ==============================
   COMANDO
============================== */

async function send() {

  const text =
    input.value.trim();


  if (!text) {
    return;
  }


  add(text, "user");

  input.value = "";


  const normalized =
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  /* HORA */

  if (normalized.includes("hora")) {

    const time =
      new Date()
        .toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );

    reply(`São ${time}.`);

    return;
  }


  /* STATUS */

  if (normalized.includes("status")) {

    reply(
      "Diagnóstico concluído. Todos os sistemas estão online."
    );

    return;
  }


  /* IDENTIDADE */

  if (
    normalized.includes("quem e voce") ||
    normalized.includes("seu nome")
  ) {

    reply(
      "Sou Jarvis, seu assistente virtual."
    );

    return;
  }


  /* SAUDAÇÃO */

  if (
    normalized === "oi" ||
    normalized === "ola" ||
    normalized === "olá"
  ) {

    reply(
      "Olá. Todos os sistemas estão funcionando normalmente."
    );

    return;
  }


  /* IA */

  await askAI(text);

}


/* ==============================
   INTELIGÊNCIA ARTIFICIAL
============================== */

async function askAI(text) {

  setThinking(true);


  try {

    conversation.push({

      role: "user",

      content: text

    });


    /*
      Mantém somente as últimas mensagens
      para evitar um histórico gigante.
    */

    if (conversation.length > 12) {

      conversation =
        conversation.slice(-12);

    }


    const response =
      await fetch(
        "/api/chat",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              messages:
                conversation
            })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Erro na API"
      );

    }


    const answer =
      data.answer;


    conversation.push({

      role: "assistant",

      content: answer

    });


    reply(answer);

  }


  catch (error) {

    console.error(error);

    reply(
      "Não consegui estabelecer comunicação com a inteligência artificial."
    );

  }


  finally {

    setThinking(false);

  }

}


/* ==============================
   IMAGEM
============================== */

imageInput.onchange =
  async () => {

    const file =
      imageInput.files[0];


    if (!file) {
      return;
    }


    if (
      !file.type.startsWith("image/")
    ) {

      reply(
        "Esse arquivo não é uma imagem válida."
      );

      return;

    }


    /*
      Mostra a imagem antes de enviar.
    */

    const reader =
      new FileReader();


    reader.onload =
      () => {

        imagePreview.innerHTML =
          `<img src="${reader.result}" alt="Imagem selecionada">`;

        imagePreview.classList.add(
          "show"
        );

      };


    reader.readAsDataURL(file);


    const question =
      prompt(
        "O que você quer que Jarvis analise?",
        "O que você consegue identificar nesta imagem?"
      );


    if (!question) {
      return;
    }


    add(
      question,
      "user"
    );


    setThinking(true);


    try {

      const form =
        new FormData();


      form.append(
        "image",
        file
      );


      form.append(
        "question",
        question
      );


      const response =
        await fetch(
          "/api/vision",
          {

            method: "POST",

            body: form

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error
        );

      }


      reply(
        data.answer
      );

    }


    catch (error) {

      console.error(error);

      reply(
        "Não consegui analisar essa imagem."
      );

    }


    finally {

      setThinking(false);

    }

  };


/* ==============================
   ENTER
============================== */

input.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      event.preventDefault();

      send();

    }

  }
);


/* ==============================
   BOTÃO ENVIAR
============================== */

document
  .getElementById("send")
  .onclick =
  send;


/* ==============================
   STATUS
============================== */

document
  .getElementById("status")
  .onclick =
  () => {

    reply(
      "Diagnóstico concluído. Todos os sistemas online."
    );

  };


/* ==============================
   HORA
============================== */

document
  .getElementById("time")
  .onclick =
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

    reply(
      `São ${time}.`
    );

  };


/* ==============================
   LIMPAR
============================== */

document
  .getElementById("clear")
  .onclick =
  () => {

    chat.innerHTML = "";

    conversation = [];

    imagePreview.innerHTML = "";

    imagePreview.classList.remove(
      "show"
    );


    add(
      "Painel limpo. Aguardando comando."
    );

  };


/* ==============================
   MICROFONE
============================== */

document
  .getElementById("mic")
  .onclick =
  () => {

    /*
      Alguns navegadores bloqueiam
      reconhecimento de voz em páginas
      que não estão em HTTPS.

      Se o navegador não permitir,
      usamos o ditado do teclado.
    */

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

      input.focus();

      add(
        "Use o microfone 🎤 do teclado do iPhone para ditar."
      );

      return;

    }


    const recognition =
      new SpeechRecognition();


    recognition.lang =
      "pt-BR";

    recognition.continuous =
      false;

    recognition.interimResults =
      false;


    online.textContent =
      "● LISTENING";


    recognition.onresult =
      event => {

        const transcript =
          event
            .results[0][0]
            .transcript;


        input.value =
          transcript;


        online.textContent =
          "● SYSTEM ONLINE";


        send();

      };


    recognition.onerror =
      () => {

        online.textContent =
          "● SYSTEM ONLINE";

        input.focus();

      };


    recognition.onend =
      () => {

        online.textContent =
          "● SYSTEM ONLINE";

      };


    try {

      recognition.start();

    }

    catch (error) {

      input.focus();

    }

  };


/* ==============================
   PAINEL DE VOZ
============================== */

document
  .getElementById("voice")
  .onclick =
  () => {

    loadVoices();

    voicePanel.classList.add(
      "show"
    );

  };


document
  .getElementById("closeVoice")
  .onclick =
  () => {

    voicePanel.classList.remove(
      "show"
    );

  };


/* ==============================
   TESTAR VOZ
============================== */

document
  .getElementById("testVoice")
  .onclick =
  () => {

    speak(
      "Jarvis online. Sistemas funcionando normalmente."
    );

  };


/* ==============================
   INICIALIZAÇÃO
============================== */

loadVoices();

console.log(
  "J.A.R.V.I.S. Web iniciado."
);