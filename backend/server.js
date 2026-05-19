/**
 * LEGO-ifier — Express backend
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { createJob, getJob, updateJob, getGallery } from './db.js';
import { convertToLego } from './converter.js';

const PORT = process.env.PORT || 3000;
const app  = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Request logger
app.use((req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${_res.statusCode} (${ms}ms)`);
  });
  next();
});

// ─── Multer (memory storage, 10 MB, images only) ─────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  },
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), version: '1.0.0' });
});

// Service info
app.get('/api', (_req, res) => {
  res.json({
    name: 'LEGO-ifier API',
    version: '1.0.0',
    description: 'Convert any image into a LEGO brick masterpiece using GPT-4o + DALL-E 3.',
    endpoints: [
      'POST /api/convert',
      'GET  /api/convert/:id',
      'GET  /api/gallery',
      'GET  /api/health',
    ],
    docs: '/docs',
    health: '/api/health',
  });
});

// POST /api/convert — upload image, kick off background conversion
app.post('/api/convert', upload.single('image'), (req, res) => {
  try {
    // Validate file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FILE', message: 'An image file is required.' },
      });
    }

    // Validate + extract settings
    const { type, brickSize, colorMode, style } = req.body;

    const validTypes      = ['logo'];
    const validBrickSizes = ['small', 'medium', 'large'];
    const validColorModes = ['original', 'monochrome', 'primary'];
    const validStyles     = ['3d', 'flat'];

    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: `type must be one of: ${validTypes.join(', ')}` },
      });
    }
    if (brickSize && !validBrickSizes.includes(brickSize)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_BRICK_SIZE', message: `brickSize must be one of: ${validBrickSizes.join(', ')}` },
      });
    }
    if (colorMode && !validColorModes.includes(colorMode)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COLOR_MODE', message: `colorMode must be one of: ${validColorModes.join(', ')}` },
      });
    }
    if (style && !validStyles.includes(style)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STYLE', message: `style must be one of: ${validStyles.join(', ')}` },
      });
    }

    const settings = {
      brickSize: brickSize || 'medium',
      colorMode: colorMode || 'original',
      style:     style     || '3d',
    };
    const jobType = type || 'logo';

    // Create job record
    const id  = uuidv4();
    const job = createJob(id, jobType, settings, null);

    // Respond immediately
    res.status(200).json({ success: true, data: job });

    // Background processing
    const fileBuffer  = req.file.buffer;
    const fileMime    = req.file.mimetype;

    setImmediate(async () => {
      try {
        const result = await convertToLego(fileBuffer, fileMime, jobType, settings);
        updateJob(id, { status: 'done', resultUrl: result.resultUrl });
        console.log(`[job ${id}] done — ${result.resultUrl.slice(0, 60)}...`);
      } catch (err) {
        console.error(`[job ${id}] error:`, err.message);
        updateJob(id, { status: 'error', error: err.message });
      }
    });

  } catch (err) {
    console.error('[POST /api/convert] unexpected error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  }
});

// GET /api/convert/:id — poll job status
app.get('/api/convert/:id', (req, res) => {
  try {
    const job = getJob(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Job ${req.params.id} not found.` },
      });
    }
    res.json({
      success: true,
      data: {
        id:          job.id,
        status:      job.status,
        resultUrl:   job.resultUrl,
        originalUrl: job.originalUrl,
        type:        job.type,
        createdAt:   job.createdAt,
        settings:    job.settings,
      },
    });
  } catch (err) {
    console.error('[GET /api/convert/:id] unexpected error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  }
});

// GET /api/gallery — completed jobs
app.get('/api/gallery', (_req, res) => {
  try {
    const gallery = getGallery();
    res.json({
      success: true,
      data: gallery.map((job) => ({
        id:        job.id,
        type:      job.type,
        resultUrl: job.resultUrl,
        createdAt: job.createdAt,
        settings:  job.settings,
      })),
    });
  } catch (err) {
    console.error('[GET /api/gallery] unexpected error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
  }
});

// ─── Static frontend (dist/) ──────────────────────────────────────────────────

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback — only for non-/api routes
app.get(/^(?!\/api).*$/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // dist not built yet; just send a minimal placeholder
      res.status(200).send('<h1>LEGO-ifier</h1><p>Frontend not built yet. Run <code>npm run build</code>.</p>');
    }
  });
});

// ─── Multer error handler ─────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'Image must be smaller than 10 MB.' },
    });
  }
  if (err?.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: 'Only JPEG, PNG, and WebP images are accepted.' },
    });
  }
  console.error('[unhandled error]', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────

const server = app.listen(PORT, '0.0.0.0', () => {
  const mode = process.env.OPENAI_API_KEY ? 'LIVE (OpenAI)' : 'DEMO (no API key)';
  console.log(`🧱 LEGO-ifier backend running on port ${PORT} [${mode}]`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received — shutting down gracefully...');
  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('[server] uncaughtException:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection:', reason);
});
