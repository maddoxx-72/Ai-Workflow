const API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.1-8b-instant';

export async function callGroq(prompt, systemInstruction = 'You are a helpful enterprise AI assistant.') {
  if (!API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return 'API key missing. Mock AI response: Task context analyzed and a structured action plan was generated.';
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Groq request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No response generated.';
  } catch {
    return 'Error contacting Groq service. Please check your API key and network connection.';
  }
}

