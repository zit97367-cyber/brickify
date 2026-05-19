import React from 'react'
import { Layers, Palette, Box } from 'lucide-react'

const BRICK_SIZES = [
  { value: 'small',  label: 'Small',  sub: '48px grid' },
  { value: 'medium', label: 'Medium', sub: '32px grid' },
  { value: 'large',  label: 'Large',  sub: '16px grid' },
]

const COLOR_MODES = [
  { value: 'original',    label: 'Original',       sub: 'Preserve colors' },
  { value: 'monochrome',  label: 'Monochrome',     sub: 'B&W classic' },
  { value: 'primary',     label: 'Primary Colors', sub: 'LEGO palette' },
]

const STYLES = [
  { value: '3d',   label: '3D Realistic', sub: 'Depth & shadows' },
  { value: 'flat', label: 'Flat Top-View', sub: 'Overhead look' },
]

function OptionGroup({ label, icon: Icon, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <style>{`
        .opt-group-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #888;
        }
        .opt-btn-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .opt-btn {
          flex: 1;
          min-width: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 10px 8px;
          border-radius: 8px;
          border: 1.5px solid #2A2A2A;
          background: #111;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.1s, box-shadow 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .opt-btn:hover {
          border-color: #444;
          background: #181818;
        }
        .opt-btn.active {
          border-color: #FFD700;
          background: rgba(255, 215, 0, 0.07);
          box-shadow: 0 0 0 1px rgba(255,215,0,0.15), 0 2px 12px rgba(255,215,0,0.08);
        }
        .opt-btn-name {
          font-size: 13px;
          font-weight: 600;
          color: #F5F5F5;
          transition: color 0.15s;
        }
        .opt-btn.active .opt-btn-name { color: #FFD700; }
        .opt-btn-sub {
          font-size: 10px;
          color: #666;
          text-align: center;
        }
        .opt-btn.active .opt-btn-sub { color: rgba(255,215,0,0.6); }
      `}</style>
      <div className="opt-group-label">
        <Icon size={12} />
        {label}
      </div>
      <div className="opt-btn-row">
        {options.map(opt => (
          <button
            key={opt.value}
            className={`opt-btn${value === opt.value ? ' active' : ''}`}
            onClick={() => onChange(opt.value)}
            type="button"
          >
            <span className="opt-btn-name">{opt.label}</span>
            <span className="opt-btn-sub">{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ConversionSettings({ settings, onChange }) {
  const update = (key) => (val) => onChange({ ...settings, [key]: val })

  return (
    <div style={{
      background: '#111111',
      border: '1.5px solid #1F1F1F',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-4px' }}>
        <div style={{
          width: '3px', height: '18px',
          background: 'linear-gradient(180deg, #FFD700, #FF6B35)',
          borderRadius: '2px',
        }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F5F5F5', letterSpacing: '0.02em' }}>
          Conversion Settings
        </span>
      </div>

      <OptionGroup
        label="Brick Size"
        icon={Box}
        options={BRICK_SIZES}
        value={settings.brickSize}
        onChange={update('brickSize')}
      />
      <OptionGroup
        label="Color Mode"
        icon={Palette}
        options={COLOR_MODES}
        value={settings.colorMode}
        onChange={update('colorMode')}
      />
      <OptionGroup
        label="Render Style"
        icon={Layers}
        options={STYLES}
        value={settings.style}
        onChange={update('style')}
      />
    </div>
  )
}
