/** Pipe entry overlay — black fade with pipe graphic */
export function PipeTransition() {
  return (
    <div
      className="pipe-entering"
      style={{
        position: 'absolute', inset: 0,
        background: '#000',
        zIndex: 35,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 10,
          color: '#00A800',
          WebkitFontSmoothing: 'none',
          letterSpacing: '0.05em',
        }}
      >
        ▼ ENTERING PIPE ▼
      </div>
    </div>
  )
}
