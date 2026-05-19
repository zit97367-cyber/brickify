/**
 * LEGO-ifier converter module.
 *
 * Uses GPT-image-1 (OpenAI's image editing model) which takes the actual
 * uploaded image as input and transforms it directly into a LEGO version.
 * No description middleman — the model sees the real image.
 */

import sharp from 'sharp';
import OpenAI from 'openai';
import { createReadStream, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { toFile } from 'openai';

let _client = null;
function getClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

const DEMO_MODE = !process.env.OPENAI_API_KEY;

// ─── Prompt helpers ───────────────────────────────────────────────────────────

function brickSizeMod(brickSize) {
  switch (brickSize) {
    case 'small': return 'ultra-fine detail using tiny 1×1 and 1×2 LEGO plates in a dense pixel-art mosaic';
    case 'large': return 'chunky oversized DUPLO-style bricks with very large prominent studs';
    default:      return 'standard LEGO bricks (2×4, 2×2, 1×2) with clearly visible circular studs on every top surface';
  }
}

function colorMod(colorMode) {
  switch (colorMode) {
    case 'monochrome': return 'Use ONLY black, dark gray, and light gray LEGO bricks — strictly monochromatic.';
    case 'primary':    return 'Use ONLY classic primary LEGO brick colors: bright red, yellow, blue, white, and black.';
    default:           return 'Preserve the exact colors of the original image using the closest matching authentic LEGO brick colors.';
  }
}

function buildPrompt(settings) {
  const bsMod  = brickSizeMod(settings.brickSize);
  const colMod = colorMod(settings.colorMode);

  const viewAngle = settings.style === 'flat'
    ? 'Show it from directly above (top-down orthographic view) so only the flat stud-covered top surface is visible — like a LEGO mosaic.'
    : 'Show it from a 30–40 degree angle so both the top stud surface AND the side brick-wall faces are visible simultaneously — classic LEGO product photo perspective.';

  return [
    'Transform this image into a hyper-photorealistic 3D LEGO brick sculpture.',
    'Recreate the exact same shape, silhouette, and composition using physical LEGO bricks.',
    `Brick size: ${bsMod}.`,
    colMod,
    'Every brick must show: glossy ABS plastic surface, circular cylindrical studs protruding from the top face, thin mortar-line gaps between bricks, and brick seams in a classic offset masonry bond pattern.',
    'The plastic material must look exactly like real LEGO — slightly glossy, solid-colored, with subtle light reflection on the stud tops.',
    'Lighting: soft studio key light from upper-left, gentle fill light, clean drop shadow on a neutral light-gray seamless backdrop.',
    viewAngle,
    'The result must look like a real physical LEGO model photographed in a studio — NOT a cartoon, NOT a painting, NOT illustrated, NOT stylized.',
    'Render quality: photorealistic, sharp focus, 8K detail.',
  ].join(' ');
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Convert an uploaded image to a LEGO brick image.
 * Uses gpt-image-1 edit endpoint — the model sees the actual uploaded image
 * and transforms it directly, preserving the shape and colors.
 *
 * @param {Buffer} imageBuffer
 * @param {string} mimeType  - e.g. 'image/jpeg'
 * @param {'logo'} type
 * @param {{ brickSize: string, colorMode: string, style: string }} settings
 * @returns {Promise<{ resultUrl: string }>}
 */
export async function convertToLego(imageBuffer, mimeType, type, settings) {
  if (DEMO_MODE) {
    console.log('[converter] Demo mode — no OPENAI_API_KEY set.');
    await new Promise((r) => setTimeout(r, 1500));
    return { resultUrl: `https://picsum.photos/seed/${Date.now()}/1024/1024` };
  }

  const client = getClient();

  // ── Step 1: Resize & convert to PNG (gpt-image-1 edit requires PNG) ──────
  let pngBuffer;
  try {
    pngBuffer = await sharp(imageBuffer)
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch (err) {
    console.error('[converter] sharp error:', err.message);
    throw new Error('IMAGE_PROCESSING_FAILED');
  }

  // ── Step 2: Write PNG to a temp file (OpenAI SDK needs a file stream) ────
  const tmpPath = join(tmpdir(), `legoify-${randomUUID()}.png`);
  try {
    writeFileSync(tmpPath, pngBuffer);
  } catch (err) {
    console.error('[converter] tmp write error:', err.message);
    throw new Error('IMAGE_PROCESSING_FAILED');
  }

  // ── Step 3: Call gpt-image-1 edit — image goes in directly ───────────────
  const prompt = buildPrompt(settings);
  console.log('[converter] gpt-image-1 prompt:', prompt.slice(0, 150) + '...');

  let resultUrl;
  try {
    const imageFile = await toFile(createReadStream(tmpPath), 'image.png', { type: 'image/png' });

    const response = await client.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt,
      n: 1,
      size: '1024x1024',
    });

    // gpt-image-1 returns base64 by default
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data in response');

    // Convert base64 to a data URL the frontend can display
    resultUrl = `data:image/png;base64,${b64}`;
  } catch (err) {
    console.error('[converter] gpt-image-1 error:', err.message);
    throw new Error('IMAGE_GENERATION_FAILED: ' + err.message);
  } finally {
    // Clean up temp file
    try { unlinkSync(tmpPath); } catch (_) {}
  }

  return { resultUrl };
}
