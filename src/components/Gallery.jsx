import React from 'react'
import { Clock, Image, AlertCircle, Download } from 'lucide-react'

function formatRelativeTime(isoString) {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    return `${diffDays}d ago`
  } catch {
    return 'Recently'
  }
}

function GalleryCard({ item }) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = item.resultUrl
    link.download = `legoified-${item.id}.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <style>{`
        .gallery-card {
          background: #141414;
          border: 1.5px solid #1F1F1F;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          cursor: default;
          position: relative;
        }
        .gallery-card:hover {
          border-color: #2A2A2A;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .gallery-card-img-wrap {
          width: 100%;
          aspect-ratio: 1 / 1;
          background: repeating-conic-gradient(#1A1A1A 0% 25%, #161616 0% 50%) 0 0 / 16px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .gallery-card-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s;
        }
        .gallery-card:hover .gallery-card-img-wrap img {
          transform: scale(1.04);
        }
        .gallery-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.2s;
          display: flex;
          align-items: flex-end;
          padding: 10px;
        }
        .gallery-card:hover .gallery-card-overlay { opacity: 1; }
        .gallery-card-dl {
          background: rgba(255,215,0,0.9);
          border: none;
          border-radius: 6px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #000;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .gallery-card-dl:hover { background: #FFD700; }
        .gallery-card-footer {
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #1F1F1F;
        }
        .gallery-type-badge {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(255,215,0,0.1);
          color: #FFD700;
          border: 1px solid rgba(255,215,0,0.2);
        }
        .gallery-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #555;
        }
      `}</style>
      <div className="gallery-card">
        <div className="gallery-card-img-wrap">
          <img src={item.resultUrl} alt={`LEGO conversion - ${item.type}`} loading="lazy" />
          <div className="gallery-card-overlay">
            <button className="gallery-card-dl" onClick={handleDownload}>
              <Download size={11} />
              Download
            </button>
          </div>
        </div>
        <div className="gallery-card-footer">
          <span className="gallery-type-badge">{item.type}</span>
          <span className="gallery-time">
            <Clock size={10} />
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
      </div>
    </>
  )
}

export default function Gallery({ items, loading, error }) {
  return (
    <>
      <style>{`
        @keyframes gallery-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gallery-section {
          animation: gallery-in 0.6s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        @media (max-width: 480px) {
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .gallery-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 20px;
          color: #444;
          text-align: center;
        }
        .gallery-empty-icon {
          width: 56px;
          height: 56px;
          background: #1A1A1A;
          border: 1.5px solid #2A2A2A;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gallery-skeleton {
          background: linear-gradient(90deg, #1A1A1A 25%, #222 50%, #1A1A1A 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 12px;
          aspect-ratio: 1 / 1;
        }
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
      `}</style>

      <div className="gallery-section">
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '3px', height: '20px',
              background: 'linear-gradient(180deg, #FF6B35, #FFD700)',
              borderRadius: '2px',
            }} />
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '22px',
              letterSpacing: '0.06em',
              color: '#F5F5F5',
              fontWeight: 400,
            }}>
              Recent Creations
            </h2>
          </div>
          {items.length > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#555',
              background: '#1A1A1A',
              border: '1px solid #2A2A2A',
              borderRadius: '999px',
              padding: '3px 10px',
            }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {loading && (
          <div className="gallery-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="gallery-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 16px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '13px',
          }}>
            <AlertCircle size={15} />
            <span>Unable to load gallery — {error}</span>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="gallery-empty">
            <div className="gallery-empty-icon">
              <Image size={24} color="#444" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>No creations yet</div>
              <div style={{ fontSize: '12px', color: '#444' }}>Convert your first image to get started</div>
            </div>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="gallery-grid">
            {items.map((item, i) => (
              <div key={item.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <GalleryCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
