export default async function handler(req, res) {
  try {
    const key = process.env.OPENROUTER_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "Chave OPENROUTER_API_KEY não encontrada"
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${key}`
      }
    });

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}