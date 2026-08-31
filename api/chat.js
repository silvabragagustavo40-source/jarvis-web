export default async function handler(req, res) {
  try {
    // Apenas POST
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Método não permitido"
      });
    }
    // Chave da OpenRouter
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return res.status(500).json({
        error: "Chave OPENROUTER_API_KEY não encontrada"
      });
    }
    // Dados enviados pelo J.A.R.V.I.S.
    const { messages, model } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Mensagens não encontradas"
      });
    }
    // Comunicação com a IA
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": "https://vercel.app",
          "X-Title": "J.A.R.V.I.S. V4"
        },
        body: JSON.stringify({
          model: model || "meta-llama/llama-3.1-8b-instruct",
          messages: messages
        })
      }
    );
    const data = await response.json();
    // Se a OpenRouter retornar erro
    if (!response.ok) {
      console.error("OpenRouter:", data);
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.error ||
          "Erro retornado pela OpenRouter"
      });
    }
    // Extrair resposta da IA
    const answer =
      data?.choices?.[0]?.message?.content;
    if (!answer) {
      return res.status(500).json({
        error: "A IA não retornou uma resposta válida"
      });
    }
    // Resposta para o script.js
    return res.status(200).json({
      answer: answer
    });
  } catch (error) {
    console.error("Erro /api/chat:", error);
    return res.status(500).json({
      error: error.message || "Erro interno do servidor"
    });
  }
}