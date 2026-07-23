import React, { useState } from 'react';
import { levelUpReward } from '../../utils/math';

export const LevelRewardsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lookupLevel, setLookupLevel] = useState<number | ''>('');

  const milestones = [2, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99];

  // Split milestones into two columns for a wider, shorter layout
  const col1 = milestones.slice(0, 6);
  const col2 = milestones.slice(6, 12);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          background: 'none',
          border: '1px solid #f39c12',
          color: '#f39c12',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          marginLeft: '1rem',
          verticalAlign: 'middle',
          transition: 'background 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(243, 156, 18, 0.1)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        View Level Rewards
      </button>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              padding: '2rem',
              borderRadius: '12px',
              width: '600px',
              maxWidth: '95vw',
              border: '1px solid #333',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem', right: '1rem',
                background: 'none', border: 'none',
                color: '#666', fontSize: '1.5rem', cursor: 'pointer',
                lineHeight: 1
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = '#666'}
            >
              &times;
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#f39c12', fontSize: '1.25rem', fontWeight: 600 }}>
              Level Up Reward Curve
            </h3>
            
            <div style={{ marginBottom: '1.5rem', background: '#222', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>Check a Specific Level:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input 
                  type="number"
                  min="2" max="99"
                  placeholder="e.g. 50"
                  value={lookupLevel}
                  onChange={(e) => setLookupLevel(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '80px', padding: '0.5rem', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px', fontSize: '1rem' }}
                />
                <span style={{ fontSize: '1rem', color: '#82ca9d', fontWeight: 600 }}>
                  {typeof lookupLevel === 'number' && lookupLevel >= 2 && lookupLevel <= 99 
                    ? `+${levelUpReward(lookupLevel).toLocaleString()} Credits` 
                    : '-'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Column 1 */}
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0', borderBottom: '1px solid #444', color: '#888', fontWeight: 500 }}>Level</th>
                    <th style={{ padding: '0.5rem 0', borderBottom: '1px solid #444', color: '#888', textAlign: 'right', fontWeight: 500 }}>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {col1.map(lvl => (
                    <tr key={lvl}>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #222', color: '#ddd' }}>{lvl}</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #222', textAlign: 'right', color: '#8884d8', fontWeight: 500 }}>
                        +{levelUpReward(lvl).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Column 2 */}
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.5rem 0', borderBottom: '1px solid #444', color: '#888', fontWeight: 500 }}>Level</th>
                    <th style={{ padding: '0.5rem 0', borderBottom: '1px solid #444', color: '#888', textAlign: 'right', fontWeight: 500 }}>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {col2.map(lvl => (
                    <tr key={lvl}>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #222', color: '#ddd' }}>{lvl}</td>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #222', textAlign: 'right', color: '#8884d8', fontWeight: 500 }}>
                        +{levelUpReward(lvl).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
};
