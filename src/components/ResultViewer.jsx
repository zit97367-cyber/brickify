import React, { useState } from 'react'
import { Download, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

export default function ResultViewer({ originalPreview, resultUrl, onConvertAnother }) {
  const [zoom, setZoom] = useState(1)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const handleDownload = async () => {
    try {
      const link = document.createElement('a')
      link.href = resultUrl
      link.download = `legoified-${Date.now()}.png`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error('Download failed:', e)
    }
  }

  return (
    <>
      <style>{`
        @keyframes result-reveal {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .result-viewer {
          animation: result-reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .result-panel {
          background: #111;
          border: 1.5px solid #2A2A2A;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .result-panel-header {
          padding: 10px 14px;
          background: #141414;
          border-bottom: 1px solid #2A2A2A;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .result-panel-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #666;
        }
        .result-panel-body {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          max-height: 360px;
          overflow: auto;
          padding: 16px;
          background: repeating-conic-gradient(#1A1A1A 0% 25%, #161616 0% 50%) 0 0 / 20px 20px;
        }
        .result-panel-body img {
          max-width: 100%;
          max-height: 320px;
          object-fit: contain;
          border-radius: 4px;
          display: block;
          transition: transform 0.2s;
          cursor: zoom-in;
        }
        .result-zoom-btn {
          background: #1F1F1F;
          border: 1px solid #2A2A2A;
          border-radius: 6px;
          color: #AAA;
          padding: 3px 7px;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: border-color 0.15s, color 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .result-zoom-btn:hover { border-color: #444; color: #F5F5F5; }

        .result-success-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #22c55e;
        }

        .btn-download {
          flex: 1;
          padding: 14px;
          background: linear-gradient(135deg, #FFD700, #FFC200);
          color: #000;
          font-weight: 700;
          font-size: 14px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: filter 0.15s, transform 0.1s, box-shadow 0.15s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 2px 16px rgba(255,215,0,0.2);
        }
        .btn-download:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 4px 24px rgba(255,215,0,0.3);
        }
        .btn-download:active { transform: translateY(0); }

        .btn-another {
          flex: 1;
          padding: 14px;
          background: transparent;
          color: #F5F5F5;
          font-weight: 600;
          font-size: 14px;
          border: 1.5px solid #2A2A2A;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-another:hover {
          border-color: #444;
          background: #1A1A1A;
          transform: translateY(-1px);
        }
        .btn-another:active { transform: translateY(0); }

        .lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.92);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          cursor: zoom-out;
          backdrop-filter: blur(8px);
        }
        .lightbox-overlay img {
          max-width: min(90vw, 900px);
          max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 8px 64px rgba(0,0,0,0.8);
        }
        .lightbox-close {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          font-size: 20px;
          transition: background 0.15s;
        }
        .lightbox-close:hover { background: rgba(255,255,255,0.2); }

        @media (max-width: 640px) {
          .result-panels-row { flex-direction: column !important; }
        }
      `}</style>

      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <img src={resultUrl} alt="LEGO result full size" onClick={e => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>×</button>
        </div>
      )}

      <div className="result-viewer" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Success banner */}
        <div className="result-success-badge">
          <span style={{ fontSize: '16px' }}>🧱</span>
          <span>Your LEGO masterpiece is ready!</span>
        </div>

        {/* Side-by-side panels */}
        <div className="result-panels-row" style={{ display: 'flex', gap: '12px' }}>
          {/* Original */}
          <div className="result-panel" style={{ flex: 1 }}>
            <div className="result-panel-header">
              <span className="result-panel-title">Original</span>
            </div>
            <div className="result-panel-body">
              <img src={originalPreview} alt="Original upload" />
            </div>
          </div>

          {/* Result */}
          <div className="result-panel" style={{ flex: 1 }}>
            <div className="result-panel-header">
              <span className="result-panel-title" style={{ color: '#FFD700' }}>LEGO Version</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="result-zoom-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
                  <ZoomOut size={11} />
                </button>
                <button className="result-zoom-btn" onClick={() => setZoom(1)}>
                  {Math.round(zoom * 100)}%
                </button>
                <button className="result-zoom-btn" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
                  <ZoomIn size={11} />
                </button>
                <button className="result-zoom-btn" onClick={() => setLightboxOpen(true)}>
                  <Maximize2 size={11} />
                </button>
              </div>
            </div>
            <div className="result-panel-body">
              <img
                src={resultUrl}
                alt="LEGO conversion result"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', cursor: 'zoom-in' }}
                onClick={() => setLightboxOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-download" onClick={handleDownload}>
            <Download size={16} />
            Download Result
          </button>
          <button className="btn-another" onClick={onConvertAnother}>
            <RefreshCw size={15} />
            Convert Another
          </button>
        </div>
      </div>
    </>
  )
}
