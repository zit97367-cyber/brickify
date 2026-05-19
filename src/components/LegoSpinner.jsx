import React from 'react'

export default function LegoSpinner({ size = 48, label = 'Processing...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <style>{`
        @keyframes lego-spin {
          0%   { transform: rotate(0deg) scale(1); }
          25%  { transform: rotate(90deg) scale(1.08); }
          50%  { transform: rotate(180deg) scale(1); }
          75%  { transform: rotate(270deg) scale(1.08); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes lego-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        @keyframes stud-pop {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-3px); }
        }
        .lego-spinner-wrap {
          animation: lego-spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lego-brick-body {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #FFD700 0%, #FFC200 50%, #E6A800 100%);
          border-radius: 10px;
          position: relative;
          box-shadow:
            0 4px 0 #B8860B,
            0 6px 12px rgba(255,215,0,0.25),
            inset 0 1px 0 rgba(255,255,255,0.35);
        }
        .lego-stud {
          position: absolute;
          background: linear-gradient(135deg, #FFE44D 0%, #FFD700 50%, #D4A400 100%);
          border-radius: 50%;
          box-shadow:
            0 2px 0 #B8860B,
            inset 0 1px 0 rgba(255,255,255,0.4);
          animation: stud-pop 0.6s ease-in-out infinite;
        }
        .lego-label {
          animation: lego-pulse 1.2s ease-in-out infinite;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.04em;
          color: #FFD700;
        }
      `}</style>
      <div className="lego-spinner-wrap" style={{ width: size, height: size }}>
        <div className="lego-brick-body">
          {/* 2x2 studs grid */}
          {[
            { top: '14%', left: '18%', animationDelay: '0s' },
            { top: '14%', left: '56%', animationDelay: '0.15s' },
            { top: '56%', left: '18%', animationDelay: '0.3s' },
            { top: '56%', left: '56%', animationDelay: '0.45s' },
          ].map((pos, i) => (
            <div
              key={i}
              className="lego-stud"
              style={{
                top: pos.top,
                left: pos.left,
                width: '26%',
                height: '26%',
                animationDelay: pos.animationDelay,
              }}
            />
          ))}
        </div>
      </div>
      {label && <span className="lego-label">{label}</span>}
    </div>
  )
}
