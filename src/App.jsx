import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AlertCircle, Zap } from 'lucide-react'
import UploadZone from './components/UploadZone.jsx'
import ConversionSettings from './components/ConversionSettings.jsx'
import ResultViewer from './components/ResultViewer.jsx'
import Gallery from './components/Gallery.jsx'
import LegoSpinner from './components/LegoSpinner.jsx'

const POLL_INTERVAL = 2000

// LEGO brick SVG icon
function LegoBrickIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="10" width="28" height="18" rx="3" fill="#FFD700" />
      <rect x="2" y="10" width="28" height="18" rx="3" fill="url(#brickGrad)" />
      {/* Studs */}
      <ellipse cx="9" cy="10" rx="4" ry="2.5" fill="#FFC200" stroke="#E6A800" strokeWidth="1" />
      <ellipse cx="23" cy="10" rx="4" ry="2.5" fill="#FFC200" stroke="#E6A800" strokeWidth="1" />
      <rect x="5" y="7.5" width="8" height="4" rx="2" fill="#FFD700" />
      <rect x="19" y="7.5" width="8" height="4" rx="2" fill="#FFD700" />
      <ellipse cx="9" cy="7.5" rx="4" ry="2" fill="#FFC200" stroke="#E6A800" strokeWidth="0.8" />
      <ellipse cx="23" cy="7.5" rx="4" ry="2" fill="#FFC200" stroke="#E6A800" strokeWidth="0.8" />
      {/* Side detail */}
      <rect x="2" y="22" width="28" height="4" rx="0" fill="rgba(0,0,0,0.15)" />
      <defs>
        <linearGradient id="brickGrad" x1="2" y1="10" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function App() {
  // Upload state
  const [uploadedFile, setUploadedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [type, setType] = useState('logo')
  const [settings, setSettings] = useState({ brickSize: 'medium', colorMode: 'original', style: '3d' })

  // Job / conversion state
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState(null)

  // Gallery state
  const [gallery, setGallery] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  const [galleryError, setGalleryError] = useState(null)

  // Poll ref
  const pollRef = useRef(null)

  // Load gallery on mount
  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    setGalleryLoading(true)
    setGalleryError(null)
    try {
      const res = await fetch('/api/gallery')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) {
        setGallery(data.data || [])
      } else {
        throw new Error(data.error?.message || 'Unknown error')
      }
    } catch (err) {
      console.error('Gallery fetch error:', err)
      setGalleryError(err.message)
      setGallery([])
    } finally {
      setGalleryLoading(false)
    }
  }

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const pollJobStatus = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/convert/${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message || 'Poll error')

      const job = data.data
      setJobStatus(job.status)

      if (job.status === 'done') {
        stopPolling()
        setIsConverting(false)
        setResultUrl(job.resultUrl)
        fetchGallery()
      } else if (job.status === 'error') {
        stopPolling()
        setIsConverting(false)
        setError('Conversion failed. Please try again.')
      }
    } catch (err) {
      console.error('Poll error:', err)
      stopPolling()
      setIsConverting(false)
      setError(err.message || 'Error checking conversion status.')
    }
  }, [stopPolling])

  const handleConvert = async () => {
    if (!uploadedFile || isConverting) return
    setError(null)
    setIsConverting(true)
    setJobId(null)
    setJobStatus(null)
    setResultUrl(null)

    try {
      const formData = new FormData()
      formData.append('image', uploadedFile)
      formData.append('type', type)
      formData.append('brickSize', settings.brickSize)
      formData.append('colorMode', settings.colorMode)
      formData.append('style', settings.style)

      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message || 'Conversion failed to start')

      const id = data.data.id
      setJobId(id)
      setJobStatus(data.data.status)

      // Start polling
      pollRef.current = setInterval(() => pollJobStatus(id), POLL_INTERVAL)
      // Poll immediately
      pollJobStatus(id)
    } catch (err) {
      console.error('Convert error:', err)
      setIsConverting(false)
      setError(err.message || 'Failed to start conversion. Please try again.')
    }
  }

  const handleFileSelect = (file, dataUrl) => {
    setUploadedFile(file)
    setPreview(dataUrl)
    setError(null)
    setResultUrl(null)
    setJobId(null)
    setJobStatus(null)
  }

  const handleClear = () => {
    stopPolling()
    setUploadedFile(null)
    setPreview(null)
    setError(null)
    setResultUrl(null)
    setJobId(null)
    setJobStatus(null)
    setIsConverting(false)
  }

  const handleConvertAnother = () => {
    stopPolling()
    setUploadedFile(null)
    setPreview(null)
    setError(null)
    setResultUrl(null)
    setJobId(null)
    setJobStatus(null)
    setIsConverting(false)
  }

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling])

  const showSettings = !!preview && !resultUrl
  const showResult = !!resultUrl
  const showConvertBtn = !!preview && !resultUrl

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes header-in {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes noise-drift {
          0%   { transform: translate(0, 0); }
          50%  { transform: translate(-1%, -1%); }
          100% { transform: translate(0, 0); }
        }

        .app-bg {
          min-height: 100vh;
          background: #0F0F0F;
          position: relative;
          overflow-x: hidden;
        }
        .app-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,215,0,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 90% 80%, rgba(255,107,53,0.04) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .app-container {
          position: relative;
          z-index: 1;
          max-width: 680px;
          margin: 0 auto;
          padding: 0 20px 80px;
        }

        /* Header */
        .app-header {
          padding: 40px 0 32px;
          text-align: center;
          animation: header-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .app-header-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .app-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(48px, 10vw, 72px);
          letter-spacing: 0.04em;
          background: linear-gradient(135deg, #FFD700 0%, #FFC200 40%, #FF9A00 70%, #FF6B35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          font-weight: 400;
        }
        .app-tagline {
          font-size: 14px;
          color: #666;
          font-weight: 400;
          letter-spacing: 0.02em;
          margin-top: 4px;
        }
        .app-tagline strong {
          color: #888;
          font-weight: 600;
        }

        /* Stats bar */
        .stats-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #555;
        }
        .stat-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #FFD700;
        }

        /* Main card */
        .main-card {
          background: #1A1A1A;
          border: 1.5px solid #2A2A2A;
          border-radius: 20px;
          padding: 28px;
          animation: fade-up 0.7s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
          box-shadow: 0 4px 40px rgba(0,0,0,0.5);
        }
        @media (max-width: 480px) {
          .main-card { padding: 20px 16px; border-radius: 16px; }
        }

        /* Type toggle */
        .type-toggle {
          display: flex;
          gap: 8px;
          background: #111;
          border: 1.5px solid #2A2A2A;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 24px;
        }
        .type-pill {
          flex: 1;
          padding: 10px 16px;
          border-radius: 7px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, box-shadow 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          letter-spacing: 0.01em;
        }
        .type-pill.inactive {
          background: transparent;
          color: #555;
        }
        .type-pill.inactive:hover { color: #888; background: #161616; }
        .type-pill.active {
          background: linear-gradient(135deg, #FFD700, #FFC200);
          color: #000;
          box-shadow: 0 2px 12px rgba(255,215,0,0.25);
        }

        /* Divider */
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #2A2A2A 20%, #2A2A2A 80%, transparent);
          margin: 24px 0;
        }

        /* Convert button */
        .convert-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #FFD700 0%, #FFC200 100%);
          color: #000;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 800;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: filter 0.15s, transform 0.1s, box-shadow 0.2s;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 20px rgba(255,215,0,0.2);
          position: relative;
          overflow: hidden;
        }
        .convert-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        .convert-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(255,215,0,0.35);
        }
        .convert-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .convert-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(0.3);
        }
        .convert-btn.processing {
          background: linear-gradient(135deg, #1F1F1F, #1A1A1A);
          color: #FFD700;
          box-shadow: 0 0 0 1px #2A2A2A;
          cursor: wait;
        }

        /* Error banner */
        .error-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 13px;
          line-height: 1.5;
          animation: fade-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* Processing status */
        .processing-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          color: #555;
          margin-top: 12px;
        }
        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #FFD700;
          animation: pulse-dot 1s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }

        /* Gallery section */
        .gallery-wrap {
          margin-top: 48px;
          animation: fade-up 0.8s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* CreateOS Badge */
        #createos-badge {
          position: fixed;
          bottom: 12px;
          right: 12px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 999px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
          font-size: 11px;
          font-weight: 500;
          color: #374151;
          text-decoration: none;
          font-family: system-ui, sans-serif;
        }
        #createos-badge:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        #createos-badge img { width: 14px; height: 14px; }
      `}</style>

      <div className="app-bg">
        <div className="app-container">

          {/* ── Header ── */}
          <header className="app-header">
            <div className="app-header-logo">
              <LegoBrickIcon size={40} />
              <h1 className="app-title">LEGOify</h1>
            </div>
            <p className="app-tagline">
              Transform any <strong>logo or image</strong> into photorealistic LEGO brick art
            </p>
            <div className="stats-bar">
              {[
                'Photorealistic 3D rendering',
                'Custom brick sizes',
                'LEGO color palette',
              ].map((s, i) => (
                <span key={i} className="stat-item">
                  <span className="stat-dot" />
                  {s}
                </span>
              ))}
            </div>
          </header>

          {/* ── Main card ── */}
          <div className="main-card">

            {/* Error banner */}
            {error && (
              <div className="error-banner" style={{ marginBottom: '20px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px', color: '#ef4444' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Mode label */}
            {!showResult && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🧱</span>
                <span style={{ fontSize: '13px', color: '#888', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Logo / Image LEGOifier</span>
              </div>
            )}

            {/* Upload zone / result */}
            {showResult ? (
              <ResultViewer
                originalPreview={preview}
                resultUrl={resultUrl}
                onConvertAnother={handleConvertAnother}
              />
            ) : (
              <>
                <UploadZone
                  preview={preview}
                  onFileSelect={handleFileSelect}
                  onClear={handleClear}
                />

                {/* Settings */}
                {showSettings && (
                  <>
                    <div className="section-divider" />
                    <ConversionSettings settings={settings} onChange={setSettings} />
                  </>
                )}

                {/* Convert button */}
                {showConvertBtn && (
                  <div style={{ marginTop: '20px' }}>
                    <button
                      className={`convert-btn${isConverting ? ' processing' : ''}`}
                      onClick={handleConvert}
                      disabled={isConverting || !uploadedFile}
                    >
                      {isConverting ? (
                        <>
                          <LegoSpinner size={24} label={null} />
                          <span>Generating your LEGO masterpiece...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={17} />
                          LEGOify It! 🧱
                        </>
                      )}
                    </button>
                    {isConverting && jobStatus && (
                      <div className="processing-status">
                        <span className="status-dot" />
                        <span>
                          {jobStatus === 'processing'
                            ? 'Processing bricks…'
                            : jobStatus === 'pending'
                            ? 'Queued, starting soon…'
                            : `Status: ${jobStatus}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Gallery ── */}
          <div className="gallery-wrap">
            <Gallery
              items={gallery}
              loading={galleryLoading}
              error={galleryError}
            />
          </div>
        </div>
      </div>

      {/* ── CreateOS Badge ── */}
      <a
        id="createos-badge"
        href="https://createos.sh/app"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="https://nodeops.network/SymbolBlack.svg" alt="" />
        Built with CreateOS
      </a>
    </>
  )
}
