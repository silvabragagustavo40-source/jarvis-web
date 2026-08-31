export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Método não permitido"
      });
    }
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY não encontrada na Vercel"
      });
    }
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Nenhuma mensagem foi recebida"
      });
    }
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": "https://vercel.com",
          "X-Title": "J.A.R.V.I.S. V4"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: messages
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error("ERRO OPENROUTER:", data);
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Erro retornado pela OpenRouter"
      });
    }
    const answer =
      data?.choices?.[0]?.message?.content;
    if (!answer) {
      console.error("RESPOSTA SEM TEXTO:", data);
      return res.status(500).json({
        error: "A OpenRouter não retornou texto da IA"
      });
    }
    return res.status(200).json({
      answer: answer
    });
  } catch (error) {
    console.error("ERRO NO CHAT:", error);
    return res.status(500).json({
      error: error.message || "Erro interno no servidor"
    });
  }
}