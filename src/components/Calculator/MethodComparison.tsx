import React, { useState } from 'react';
import Select from 'react-select';
import { useCreditCalculation } from '../../hooks/useCreditCalculation';
import type { MethodConfig, SkillType } from '../../hooks/useCreditCalculation';
import { CrossoverChart } from './CrossoverChart';
import { POPULAR_MONSTERS } from '../../utils/data';
import { LevelRewardsModal } from './LevelRewardsModal';

const getDisplayTitle = (config: MethodConfig, suffix?: string) => {
  let baseTitle = '';
  if (config.skillType === 'skilling') {
    baseTitle = 'Skilling Method';
  } else {
    const combatStyle = config.skillType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (config.monster) {
      baseTitle = `${combatStyle} vs ${config.monster.name}`;
    } else {
      baseTitle = `${combatStyle} Method`;
    }
  }
  return suffix ? `${baseTitle} (${suffix})` : baseTitle;
};

const MethodInput: React.FC<{
  config: MethodConfig;
  onChange: (config: MethodConfig) => void;
}> = ({ config, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  
  // Create base options once
  const baseMonsterOptions = React.useMemo(() => 
    POPULAR_MONSTERS.map(m => ({ 
      value: m.id, 
      label: `${m.name} ${m.variant ? m.variant + ' ' : ''}(Lvl ${m.combatLevel})`, 
      monster: m 
    })), 
  []);

  // Filter and limit to 50 options to prevent DOM crashing
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return baseMonsterOptions.slice(0, 50);
    const lower = inputValue.toLowerCase();
    return baseMonsterOptions.filter(o => o.label.toLowerCase().includes(lower)).slice(0, 50);
  }, [inputValue, baseMonsterOptions]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    // Delay selection to next tick so it doesn't fight native browser mouse events
    setTimeout(() => {
      target.select();
    }, 0);
  };

  const displayTitle = React.useMemo(() => getDisplayTitle(config, config.id === 'method1' ? 'A' : 'B'), [config]);

  return (
    <div className="card" style={{ padding: '1rem', backgroundColor: '#1f1f1f', borderRadius: '8px', marginBottom: '1rem' }}>
      <h3 style={{ marginTop: 0, color: '#f39c12' }}>{displayTitle}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label>Skill Type</label>
          <select 
            value={config.skillType} 
            onChange={(e) => onChange({ ...config, skillType: e.target.value as SkillType })}
            style={{ width: '100%', padding: '0.5rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          >
            <option value="skilling">Skilling</option>
            <option value="melee">Melee</option>
            <option value="ranged">Ranged</option>
            <option value="magic">Magic</option>
            <option value="shared">Shared Melee</option>
            <option value="magic-defensive">Magic Defensive</option>
          </select>
        </div>
        
        <div>
          <label>Primary XP / Hour</label>
          <input 
            type="number" 
            step="1000"
            value={config.xpPerHour} 
            onDoubleClick={handleDoubleClick}
            onChange={(e) => onChange({ ...config, xpPerHour: Number(e.target.value) })}
            style={{ width: '100%', padding: '0.5rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label>Start Level</label>
          <input 
            type="number" 
            min="1" max="99" 
            value={config.startLevel} 

            onDoubleClick={handleDoubleClick}
            onChange={(e) => onChange({ ...config, startLevel: Math.min(99, Number(e.target.value)) })}
            style={{ width: '100%', padding: '0.5rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label>Target Level</label>
          <input 
            type="number" 
            min="2" max="99" 
            value={config.targetLevel} 

            onDoubleClick={handleDoubleClick}
            onChange={(e) => onChange({ ...config, targetLevel: Math.min(99, Number(e.target.value)) })}
            style={{ width: '100%', padding: '0.5rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          />
        </div>

        {config.skillType !== 'skilling' && (
          <>
            <div>
              <label>Start HP Level</label>
              <input 
                type="number" 
                min="10" max="99" 
                value={config.startHpLevel ?? config.startLevel} 
                onDoubleClick={handleDoubleClick}
                onChange={(e) => onChange({ ...config, startHpLevel: Math.min(99, Number(e.target.value)) })}
                style={{ width: '100%', padding: '0.5rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1.2rem' }}>
                <input 
                  type="checkbox" 
                  checked={config.enableHpCredits ?? true}
                  onChange={(e) => onChange({ ...config, enableHpCredits: e.target.checked })}
                />
                Calculate HP Credits
              </label>
            </div>
          </>
        )}

        {config.skillType !== 'skilling' && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Target Monster</label>
            <Select
              options={filteredOptions}
              value={config.monster ? { value: config.monster.id, label: `${config.monster.name} ${config.monster.variant ? config.monster.variant + ' ' : ''}(Lvl ${config.monster.combatLevel})`, monster: config.monster } : null}
              onInputChange={(val, actionMeta) => {
                if (actionMeta.action === 'input-change') {
                  setInputValue(val);
                }
              }}
              filterOption={() => true} 
              formatOptionLabel={(option) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div>{option.monster.name} <span style={{ color: '#888', fontSize: '0.9em' }}>(Lvl {option.monster.combatLevel})</span></div>
                  {option.monster.variant && (
                    <div style={{ fontSize: '0.75rem', color: '#aaa', fontStyle: 'italic', marginTop: '-2px' }}>
                      {option.monster.variant}
                    </div>
                  )}
                </div>
              )}
              onChange={(selected) => {
                onChange({ ...config, monster: selected ? selected.monster : null });
              }}
              isClearable
              isSearchable
              styles={{
                control: (base) => ({ ...base, background: '#333', borderColor: '#444' }),
                menu: (base) => ({ ...base, background: '#333', zIndex: 100 }),
                option: (base, state) => ({ ...base, background: state.isFocused ? '#555' : '#333', color: '#fff' }),
                singleValue: (base) => ({ ...base, color: '#fff' }),
                input: (base) => ({ ...base, color: '#fff' })
              }}
            />
            {config.monster && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={config.monster.imageUrl} alt={config.monster.name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{config.monster.name} - HP: {config.monster.hitpoints} | Combat: {config.monster.combatLevel}</span>
                  {config.monster.variant && <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#888' }}>{config.monster.variant}</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {config.skillType === 'skilling' && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #444' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={!!config.secondarySkill?.enabled}
              onChange={(e) => onChange({
                ...config, 
                secondarySkill: e.target.checked 
                  ? { enabled: true, startLevel: 1, xpPerHour: 30000 }
                  : { ...config.secondarySkill, enabled: false } as any
              })}
            />
            Enable Secondary Skill (e.g., Agility from Barb Fishing)
          </label>
          
          {config.secondarySkill?.enabled && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Secondary Start Level</label>
                <input 
                  type="number" 
                  min="1" max="99" 
                  value={config.secondarySkill.startLevel} 
                  onDoubleClick={handleDoubleClick}
                  onChange={(e) => onChange({ 
                    ...config, 
                    secondarySkill: { ...config.secondarySkill!, startLevel: Math.min(99, Number(e.target.value)) } 
                  })}
                  style={{ width: '100%', padding: '0.5rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label>Secondary XP / Hour</label>
                <input 
                  type="number" 
                  step="1000"
                  value={config.secondarySkill.xpPerHour} 
                  onDoubleClick={handleDoubleClick}
                  onChange={(e) => onChange({ 
                    ...config, 
                    secondarySkill: { ...config.secondarySkill!, xpPerHour: Number(e.target.value) } 
                  })}
                  style={{ width: '100%', padding: '0.5rem', background: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const MethodComparison: React.FC = () => {
  const method1 = useCreditCalculation({
    id: 'method1',
    name: 'Method 1 (e.g., Thieving)',
    skillType: 'skilling',
    startLevel: 62,
    targetLevel: 99,
    xpPerHour: 90000,
  });

  const method2 = useCreditCalculation({
    id: 'method2',
    name: 'Method 2 (e.g., Low Combat)',
    skillType: 'melee',
    startLevel: 30,
    targetLevel: 70,
    xpPerHour: 18000,
    monster: POPULAR_MONSTERS.find(m => m.id === 'hill_giant'),
  });

  const renderResults = (method: ReturnType<typeof useCreditCalculation>) => (
    <div style={{ padding: '1.5rem', background: '#1a1a1a', borderRadius: '8px', borderTop: `4px solid ${method.config.id === 'method1' ? '#8884d8' : '#82ca9d'}`, display: 'flex', flexDirection: 'column', flex: 1, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Estimated Credits</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f39c12', lineHeight: '1.2' }}>{method.results.finalCredits.toLocaleString()}</div>
        <div style={{ fontSize: '1rem', color: '#82ca9d' }}>~{Math.round(method.results.hoursTaken > 0 ? method.results.finalCredits / method.results.hoursTaken : 0).toLocaleString()} credits/hr</div>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <tbody>
          <tr>
            <td style={{ padding: '0.5rem 0', color: '#aaa', borderBottom: '1px solid #333' }}>Time Required</td>
            <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #333', color: '#fff' }}>{method.results.hoursTaken} hrs</td>
          </tr>
          {method.config.skillType !== 'skilling' && (
            <tr>
              <td style={{ padding: '0.5rem 0', color: '#aaa', borderBottom: '1px solid #333' }}>Final HP Level</td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #333', color: '#fff' }}>{method.results.finalHpLevel}</td>
            </tr>
          )}
          {method.config.skillType === 'skilling' && method.config.secondarySkill?.enabled && (
            <tr>
              <td style={{ padding: '0.5rem 0', color: '#aaa', borderBottom: '1px solid #333' }}>Final Sec. Level</td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #333', color: '#fff' }}>{method.results.finalSecLevel}</td>
            </tr>
          )}
        </tbody>
      </table>

      {method.results.breakdown && (
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Credit Breakdown</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <tbody>
              {method.config.skillType === 'skilling' ? (
                <>
                  <tr>
                    <td style={{ padding: '0.3rem 0', color: '#aaa' }}>Passive XP <span style={{ color: '#666', fontSize: '0.85em' }}>({method.results.stats.primaryXpGained.toLocaleString()} XP)</span></td>
                    <td style={{ padding: '0.3rem 0', textAlign: 'right', color: '#ddd' }}>{method.results.breakdown.creditsFromSkillingXp.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.3rem 0', color: '#aaa' }}>Primary Levels</td>
                    <td style={{ padding: '0.3rem 0', textAlign: 'right', color: '#ddd' }}>{method.results.breakdown.creditsFromLevels.toLocaleString()}</td>
                  </tr>
                  {method.config.secondarySkill?.enabled && (
                    <tr>
                      <td style={{ padding: '0.3rem 0', color: '#aaa' }}>Secondary Levels</td>
                      <td style={{ padding: '0.3rem 0', textAlign: 'right', color: '#ddd' }}>{method.results.breakdown.creditsFromSecLevels.toLocaleString()}</td>
                    </tr>
                  )}
                </>
              ) : (
                <>
                  <tr>
                    <td style={{ padding: '0.3rem 0', color: '#aaa' }}>Monster Kills {method.config.monster && <span style={{ color: '#666', fontSize: '0.85em' }}>({method.results.stats.totalKills.toLocaleString()} kills)</span>}</td>
                    <td style={{ padding: '0.3rem 0', textAlign: 'right', color: '#ddd' }}>{method.results.breakdown.creditsFromKills.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.3rem 0', color: '#aaa' }}>Primary Levels</td>
                    <td style={{ padding: '0.3rem 0', textAlign: 'right', color: '#ddd' }}>{method.results.breakdown.creditsFromLevels.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.3rem 0', color: '#aaa' }}>HP Levels</td>
                    <td style={{ padding: '0.3rem 0', textAlign: 'right', color: '#ddd' }}>{method.results.breakdown.creditsFromHpLevels.toLocaleString()}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', color: '#e0e0e0', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#f1c40f', textAlign: 'center' }}>
        OSRS TCG Credit Calculator
        <LevelRewardsModal />
      </h1>
      <p style={{ textAlign: 'center', color: '#aaa' }}>Compare methods based on target levels and visualize diminishing returns.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <MethodInput config={method1.config} onChange={method1.setConfig} />
          {renderResults(method1)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <MethodInput config={method2.config} onChange={method2.setConfig} />
          {renderResults(method2)}
        </div>
      </div>

      <div style={{ background: '#1f1f1f', padding: '2rem', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center', marginTop: 0, color: '#f39c12' }}>Diminishing Returns Plotter (Credits/Hr vs Level)</h2>
        <CrossoverChart 
          method1Data={method1.results.dataPoints} 
          method1Name={getDisplayTitle(method1.config, 'A')}
          method2Data={method2.results.dataPoints}
          method2Name={getDisplayTitle(method2.config, 'B')}
        />
      </div>
    </div>
  );
};
