const express = require("express");
const multer = require("multer");

const app = express();

const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

app.use(express.json({ limit: "10mb" }));

app.use(express.static("public"));


// ========================================
// CHAT COM A IA
// ========================================

app.post("/api/chat", async (req, res) => {

  try {

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {

      return res.status(500).json({
        error: "GROQ_API_KEY não configurada."
      });

    }

    const messages = req.body.messages || [];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({

          model: "llama-3.3-70b-versatile",

          messages: [
            {
              role: "system",

              content:
                "Você é Jarvis, um assistente virtual avançado. Responda em português do Brasil. Seja educado, inteligente, objetivo e tecnológico. Seu nome deve ser pronunciado como Jarvis, nunca como letras separadas."
            },

            ...messages
          ],

          temperature: 0.7,

          max_tokens: 1000

        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error(data);

      return res.status(response.status).json({
        error:
          data.error?.message ||
          "Erro na comunicação com a IA."
      });

    }

    const answer =
      data.choices?.[0]?.message?.content ||
      "Não consegui gerar uma resposta.";

    res.json({
      answer
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erro interno do servidor."
    });

  }

});


// ========================================
// ANÁLISE DE IMAGENS
// ========================================

app.post(
  "/api/vision",
  upload.single("image"),

  async (req, res) => {

    try {

      const apiKey =
        process.env.GROQ_API_KEY;

      if (!apiKey) {

        return res.status(500).json({
          error:
            "GROQ_API_KEY não configurada."
        });

      }

      if (!req.file) {

        return res.status(400).json({
          error:
            "Nenhuma imagem foi enviada."
        });

      }

      const question =
        req.body.question ||
        "Descreva esta imagem.";

      const base64 =
        req.file.buffer.toString("base64");

      const imageData =
        `data:${req.file.mimetype};base64,${base64}`;

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },

          body: JSON.stringify({

            model:
              "meta-llama/llama-4-scout-17b-16e-instruct",

            messages: [

              {
                role: "system",

                content:
                  "Você é Jarvis. Analise imagens e responda em português do Brasil de forma clara e objetiva."
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
                      url: imageData
                    }

                  }

                ]

              }

            ],

            temperature: 0.5,

            max_tokens: 1000

          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        console.error(data);

        return res.status(response.status).json({
          error:
            data.error?.message ||
            "Erro ao analisar a imagem."
        });

      }

      const answer =
        data.choices?.[0]?.message?.content ||
        "Não consegui analisar essa imagem.";

      res.json({
        answer
      });

    }

    catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erro interno ao analisar a imagem."
      });

    }

  }
);


// ========================================
// TESTE DO SERVIDOR
// ========================================

app.get("/api/status", (req, res) => {

  res.json({
    online: true,
    jarvis: "online"
  });

});


// ========================================
// INICIAR
// ========================================

app.listen(PORT, () => {

  console.log(
    `J.A.R.V.I.S. online na porta ${PORT}`
  );

});