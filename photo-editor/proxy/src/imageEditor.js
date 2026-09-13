const REPLICATE_MODEL = 'qwen/qwen-image-edit-2511';

/** Run Qwen-Image-Edit-2511 through Replicate. */
async function editImage({ prompt, imageBase64, mimeType }) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) { const error = new Error('REPLICATE_API_TOKEN is not configured'); error.status = 500; throw error; }
  const { default: Replicate } = await import('replicate');
  const replicate = new Replicate({ auth: token });
  let output;
  try {
    output = await replicate.run(REPLICATE_MODEL, { input: {
      image: [Buffer.from(imageBase64, 'base64')],
      prompt, go_fast: true, aspect_ratio: 'match_input_image',
      output_format: 'png', output_quality: 95
    }});
  } catch (cause) {
    const error = new Error(cause instanceof Error ? cause.message : 'Replicate request failed');
    error.status = Number(cause?.status) || 502; throw error;
  }
  const outputFile = Array.isArray(output) ? output[0] : output;
  const outputUrl = typeof outputFile === 'string' ? outputFile :
    typeof outputFile?.url === 'function' ? outputFile.url() : outputFile?.url;
  if (!outputUrl) { const error = new Error('Image editor returned an invalid output'); error.status = 502; throw error; }
  const imageResponse = await fetch(outputUrl);
  if (!imageResponse.ok) { const error = new Error(`Could not download generated image (HTTP ${imageResponse.status})`); error.status = 502; throw error; }
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  if (!buffer.length) { const error = new Error('Generated image was empty'); error.status = 502; throw error; }
  return { imageBase64: buffer.toString('base64'), mimeType: imageResponse.headers.get('content-type')?.split(';')[0] || 'image/png' };
}

module.exports = { editImage };