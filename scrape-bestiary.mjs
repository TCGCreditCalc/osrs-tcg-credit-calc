import fs from 'fs';
import * as cheerio from 'cheerio';
import https from 'https';
import http from 'http';

const BASE_URL = 'https://oldschool.runescape.wiki/w/Bestiary/';
const PAGES = [
  'Levels_1_to_10', 'Levels_11_to_20', 'Levels_21_to_30', 'Levels_31_to_40',
  'Levels_41_to_50', 'Levels_51_to_60', 'Levels_61_to_70', 'Levels_71_to_80',
  'Levels_81_to_90', 'Levels_91_to_100', 'Levels_101_to_200', 'Levels_201_to_300',
  'Levels_301_to_400', 'Levels_401_to_500', 'Levels_501_to_600', 'Levels_601_to_700',
  'Levels_701_to_800', 'Levels_1000%2B',
];

const OUTPUT_FILE = './src/utils/monsters.json';

function fetchPage(urlStr) {
  return new Promise((resolve, reject) => {
    const isHttps = urlStr.startsWith('https');
    const client = isHttps ? https : http;
    client.get(urlStr, { headers: { 'User-Agent': 'OSRS-TCG-Calculator/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
           redirectUrl = new URL(redirectUrl, urlStr).toString();
        }
        return fetchPage(redirectUrl).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const uniqueMap = new Map();

  for (const page of PAGES) {
    console.log(`Scraping ${page}...`);
    try {
      const html = await fetchPage(BASE_URL + page);
      const $ = cheerio.load(html);
      
      $('table.wikitable tbody tr').each((i, el) => {
        const tds = $(el).find('td');
        if (tds.length >= 5) {
          // 0: Img, 1: Name, 2: Members, 3: Combat, 4: HP, ...
          const name = $(tds[1]).text().trim();
          const combatText = $(tds[3]).text().trim();
          const hpText = $(tds[4]).text().trim();
          
          if (!name) return;

          const combat = parseInt(combatText, 10);
          const hp = parseInt(hpText, 10);

          if (!isNaN(combat) && combat > 0 && !isNaN(hp) && hp > 0) {
            const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const uniqueKey = `${name}_${combat}`;
            
            if (!uniqueMap.has(uniqueKey)) {
              uniqueMap.set(uniqueKey, {
                id: id,
                name: name,
                combatLevel: combat,
                hitpoints: hp,
                imageUrl: `https://oldschool.runescape.wiki/images/${name.replace(/ /g, '_')}.png`,
              });
            }
          }
        }
      });

      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`Error scraping ${page}:`, e.message);
    }
  }

  const finalArray = Array.from(uniqueMap.values());
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalArray, null, 2));
  console.log(`Saved ${finalArray.length} unique monsters to ${OUTPUT_FILE}`);
}

run();
