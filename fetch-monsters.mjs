import fs from 'fs';
import https from 'https';

const URL = 'https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/monsters-complete.json';
const OUTPUT_FILE = './src/utils/monsters.json';

console.log('Fetching monsters data...');

https.get(URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Download complete. Parsing and filtering...');
    try {
      const db = JSON.parse(data);
      const filtered = [];

      // osrsreboxed-db monsters-complete.json is usually an object with string keys for IDs
      for (const key in db) {
        const m = db[key];
        
        // Skip duplicate IDs if they are just alternate forms with identical stats,
        // but for now we can just grab all of them that have valid combat stats.
        if (m.hitpoints > 0 && m.combat_level > 0) {
          filtered.push({
            id: m.id.toString(),
            name: m.name,
            combatLevel: m.combat_level,
            hitpoints: m.hitpoints,
            imageUrl: `https://oldschool.runescape.wiki/images/${m.name.replace(/ /g, '_')}.png`,
          });
        }
      }

      // Deduplicate by name and combat level to reduce noise (many quest variants exist)
      const uniqueMap = new Map();
      for (const m of filtered) {
        const uniqueKey = `${m.name}_${m.combatLevel}`;
        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, m);
        }
      }
      
      const finalArray = Array.from(uniqueMap.values());

      // Add missing monsters (e.g. Varlamore Buffalo)
      const EXTRA_MONSTERS = [
        {
          id: '13004',
          name: 'Buffalo',
          combatLevel: 9,
          hitpoints: 20,
          imageUrl: 'https://oldschool.runescape.wiki/images/Buffalo.png'
        }
      ];

      EXTRA_MONSTERS.forEach(extra => {
        if (!finalArray.find(m => m.name === extra.name && m.combatLevel === extra.combatLevel)) {
          finalArray.push(extra);
        }
      });

      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalArray, null, 2));
      console.log(`Saved ${finalArray.length} unique monsters to ${OUTPUT_FILE}`);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
  process.exit(1);
});
