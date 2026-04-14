export default function Welcome() {
  const palette = {
    pageBackground: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
    panel: '#ffffff',
    panelBorder: '#dbeafe',
    textPrimary: '#1f2937',
    textSecondary: '#4b5563',
    keyBorder: '#d1d5db',
    blackKey: '#111827',
    startButton: '#16a34a',
    howToButton: '#2563eb',
    beginnerButton: '#facc15',
    intermediateButton: '#fb923c',
    advancedButton: '#ef4444'
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: palette.pageBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
      <div style={{ width: '100%', maxWidth: '48rem' }}>
        <div
          style={{
            backgroundColor: palette.panel,
            borderRadius: '1rem',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.15)',
            padding: '2rem',
            marginBottom: '2rem',
            border: `1px solid ${palette.panelBorder}`
          }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.25rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '2rem',
                  height: '8rem',
                  borderRadius: '0 0 0.75rem 0.75rem',
                  border: `2px solid ${palette.keyBorder}`,
                  backgroundColor: i % 2 === 0 ? '#ffffff' : palette.blackKey
                }}
              />
            ))}
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              textAlign: 'center',
              color: palette.textPrimary,
              margin: 0
            }}>
            KwintBaseHarmony
          </h1>
          <p
            style={{
              textAlign: 'center',
              color: palette.textSecondary,
              fontSize: '1.125rem',
              marginTop: '0.5rem',
              marginBottom: 0
            }}>
            Learn music harmony through composition
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <button
            style={{
              width: '100%',
              backgroundColor: palette.startButton,
              color: '#ffffff',
              fontWeight: 700,
              padding: '1rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              boxShadow: '0 12px 24px rgba(22, 163, 74, 0.2)',
              fontSize: '1.125rem',
              cursor: 'pointer'
            }}>
            Start (Beginner)
          </button>

          <button
            style={{
              width: '100%',
              backgroundColor: palette.howToButton,
              color: '#ffffff',
              fontWeight: 700,
              padding: '1rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              boxShadow: '0 12px 24px rgba(37, 99, 235, 0.2)',
              fontSize: '1.125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}>
            <span>ⓘ</span> How to Play (Optional)
          </button>

          <div
            style={{
              paddingTop: '1rem',
              borderTop: `2px solid ${palette.panelBorder}`
            }}>
            <p
              style={{
                textAlign: 'center',
                color: palette.textSecondary,
                marginBottom: '0.75rem',
                fontWeight: 700
              }}>
              Choose Your Level:
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '0.5rem'
              }}>
              <button
                style={{
                  backgroundColor: palette.beginnerButton,
                  color: palette.textPrimary,
                  fontWeight: 700,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer'
                }}>
                Beginner
              </button>
              <button
                style={{
                  backgroundColor: palette.intermediateButton,
                  color: palette.textPrimary,
                  fontWeight: 700,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer'
                }}>
                Intermediate
              </button>
              <button
                style={{
                  backgroundColor: palette.advancedButton,
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer'
                }}>
                Advanced
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
