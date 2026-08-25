export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY não configurada na Vercel"
      });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Mensagens inválidas"
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://jarvis-web.vercel.app",
          "X-Title": "J.A.R.V.I.S."
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages: messages,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter:", data);

      return res.status(response.status).json({
        error: data?.error?.message || "Erro na API do OpenRouter"
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Não recebi uma resposta da IA."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno ao comunicar com a IA"
    });
  }
}