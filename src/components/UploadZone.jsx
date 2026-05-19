import React, { useRef, useState, useCallback } from 'react'
import { Upload, ImageIcon, X } from 'lucide-react'

export default function UploadZone({ preview, onFileSelect, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP, SVG).')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('File too large. Maximum size is 20MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => onFileSelect(file, e.target.result)
    reader.readAsDataURL(file)
  }, [onFileSelect])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)
  const handleInputChange = (e) => handleFile(e.target.files?.[0])
  const handleClick = () => { if (!preview) inputRef.current?.click() }

  if (preview) {
    return (
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <style>{`
          .upload-preview-wrap {
            position: relative;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #111;
            border: 1.5px solid #2A2A2A;
            border-radius: 12px;
            overflow: hidden;
            min-height: 220px;
            max-height: 320px;
          }
          .upload-preview-img {
            max-width: 100%;
            max-height: 300px;
            object-fit: contain;
            display: block;
            border-radius: 8px;
          }
          .upload-clear-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.75);
            border: 1px solid #3A3A3A;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
            z-index: 2;
          }
          .upload-clear-btn:hover {
            background: rgba(239,68,68,0.85);
            border-color: #ef4444;
          }
          .upload-clear-btn svg {
            color: #F5F5F5;
            width: 15px;
            height: 15px;
          }
          .preview-label {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            border: 1px solid #2A2A2A;
            border-radius: 999px;
            padding: 3px 12px;
            font-size: 11px;
            font-weight: 500;
            color: #A0A0A0;
            white-space: nowrap;
          }
        `}</style>
        <div className="upload-preview-wrap">
          <img className="upload-preview-img" src={preview} alt="Uploaded preview" />
          <button className="upload-clear-btn" onClick={onClear} title="Remove image">
            <X />
          </button>
          <span className="preview-label">✓ Image ready</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .upload-zone {
          width: 100%;
          min-height: 220px;
          border: 2px dashed #2A2A2A;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.1s;
          background: #111111;
          padding: 32px 20px;
          user-select: none;
          position: relative;
          overflow: hidden;
        }
        .upload-zone::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.04) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .upload-zone.dragging,
        .upload-zone:hover {
          border-color: #FFD700;
          background: #141414;
          transform: translateY(-1px);
        }
        .upload-zone.dragging::before,
        .upload-zone:hover::before {
          opacity: 1;
        }
        .upload-zone-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: #1F1F1F;
          border: 1.5px solid #2A2A2A;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, background 0.2s;
        }
        .upload-zone:hover .upload-zone-icon,
        .upload-zone.dragging .upload-zone-icon {
          border-color: #FFD700;
          background: rgba(255,215,0,0.08);
        }
        .upload-zone-icon svg { color: #FFD700; }
        .upload-zone-title {
          font-size: 15px;
          font-weight: 600;
          color: #F5F5F5;
          text-align: center;
        }
        .upload-zone-sub {
          font-size: 12px;
          color: #666;
          text-align: center;
          line-height: 1.5;
        }
        .upload-zone-badge {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .upload-zone-badge span {
          background: #1F1F1F;
          border: 1px solid #2A2A2A;
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 11px;
          color: #888;
          font-weight: 500;
        }
        .upload-zone.dragging .upload-zone-title { color: #FFD700; }
      `}</style>
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label="Upload image"
      >
        <div className="upload-zone-icon">
          {dragging ? <ImageIcon size={24} /> : <Upload size={24} />}
        </div>
        <div>
          <div className="upload-zone-title">
            {dragging ? 'Drop it like it\'s hot 🔥' : 'Drop your image here'}
          </div>
          <div className="upload-zone-sub" style={{ marginTop: '4px' }}>
            or click to browse files
          </div>
        </div>
        <div className="upload-zone-badge">
          {['PNG', 'JPG', 'WEBP', 'SVG'].map(f => (
            <span key={f}>{f}</span>
          ))}
          <span>Max 20MB</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
    </>
  )
}
