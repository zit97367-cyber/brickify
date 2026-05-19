/**
 * In-memory job store for LEGO-ifier conversions.
 *
 * Job structure:
 * {
 *   id: string,
 *   type: 'logo' | 'portrait',
 *   status: 'processing' | 'done' | 'error',
 *   resultUrl: string | null,
 *   originalUrl: string | null,
 *   createdAt: string (ISO),
 *   settings: { brickSize: string, colorMode: string, style: string },
 *   error: string | null
 * }
 */

const jobs = new Map();

/**
 * Create a new job and store it.
 * @param {string} id
 * @param {string} type - 'logo' | 'portrait'
 * @param {{ brickSize: string, colorMode: string, style: string }} settings
 * @param {string|null} originalUrl
 * @returns the created job object
 */
export function createJob(id, type, settings, originalUrl) {
  const job = {
    id,
    type,
    status: 'processing',
    resultUrl: null,
    originalUrl: originalUrl || null,
    createdAt: new Date().toISOString(),
    settings: {
      brickSize: settings.brickSize || 'medium',
      colorMode: settings.colorMode || 'original',
      style: settings.style || '3d',
    },
    error: null,
  };
  jobs.set(id, job);
  return job;
}

/**
 * Retrieve a job by ID.
 * @param {string} id
 * @returns job object or undefined
 */
export function getJob(id) {
  return jobs.get(id) || null;
}

/**
 * Apply a partial update to an existing job.
 * @param {string} id
 * @param {Partial<Job>} patch
 * @returns updated job or null if not found
 */
export function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return null;
  const updated = { ...job, ...patch };
  jobs.set(id, updated);
  return updated;
}

/**
 * Return up to 20 completed jobs with a resultUrl, sorted newest first.
 * @returns Array of job objects
 */
export function getGallery() {
  const done = [];
  for (const job of jobs.values()) {
    if (job.status === 'done' && job.resultUrl) {
      done.push(job);
    }
  }
  done.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return done.slice(0, 20);
}
