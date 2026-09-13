const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Call Gemini's image editing model.
 *
 * @param {{prompt: string, imageBase64: string, mimeType: string}} input
 * @returns {Promise<{imageBase64: string, mimeType: string}>}
 */
async function editImage({ prompt, imageBase64, mimeType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.status = 500;
    throw error;
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message || `Gemini request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    const error = new Error('Gemini response did not contain content parts');
    error.status = 502;
    throw error;
  }

  const imagePart = parts.find((part) => part?.inlineData?.data || part?.inline_data?.data);
  const blob = imagePart?.inlineData || imagePart?.inline_data;

  if (!blob?.data) {
    const error = new Error('Gemini response did not contain an edited image');
    error.status = 502;
    throw error;
  }

  return {
    imageBase64: blob.data,
    mimeType: blob.mimeType || blob.mime_type || 'image/png',
  };
}

module.exports = { editImage };
