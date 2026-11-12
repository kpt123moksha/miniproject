const SEVERITIES = ["Low", "Medium", "High", "Critical"];

async function identifyImageSeverity(file) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("Image severity detection is not configured. Set GEMINI_API_KEY in the backend environment.");
    error.status = 503;
    throw error;
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "Assess the visible drainage problem in this image. Return only the best matching severity. Low: minor blockage or little standing water. Medium: clear blockage or moderate localized pooling. High: substantial blockage or flooding that significantly affects the nearby area or access. Critical: severe, extensive flooding or a clearly immediate hazard. Judge only what is visible; do not infer hidden conditions or claim certainty. If the image does not show a drainage problem clearly, choose Medium as a cautious provisional estimate."
            },
            {
              inline_data: {
                mime_type: file.mimetype,
                data: file.buffer.toString("base64")
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              severity: { type: "STRING", enum: SEVERITIES }
            },
            required: ["severity"]
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}.`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    if (!text) throw new Error("Gemini returned no severity result.");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Gemini returned an invalid severity result.");
    }
    if (!SEVERITIES.includes(parsed.severity)) {
      throw new Error("Gemini returned an unsupported severity.");
    }

    return parsed.severity;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("Image analysis timed out. Please try again.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    console.error("Image severity analysis failed:", error.message);
    const serviceError = new Error("Could not analyze this image. Please try again.");
    serviceError.status = 502;
    throw serviceError;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { identifyImageSeverity };
