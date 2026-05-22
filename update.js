const fs = require('fs');

const STREAM_SOURCE = 'https://allmovieland.link/player.js?v=401';
// This grabs the previous state directly from your published gh-pages branch
const PREVIOUS_STATE_URL = 'https://raw.githubusercontent.com/ibappam/js/gh-pages/config.js';
const FALLBACK_MOVIERULZ = 'https://www.5movierulz.forsale/';

async function updateConfig() {
    try {
        console.log('Starting automated updates...');

        // --- 1. Fetch Stream Domain ---
        const streamRes = await fetch(STREAM_SOURCE, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const streamText = await streamRes.text();
        const streamMatch = streamText.match(/AwsIndStreamDomain\s*=\s*['"]([^'"]+)['"]/);
        const streamDomain = streamMatch ? streamMatch[1].replace(/\/+$/, '') : 'ERROR';

        // --- 2. Get Last Known Movierulz URL from GitHub Pages ---
        let lastKnownRulez = FALLBACK_MOVIERULZ;
        try {
            console.log('Fetching previous state from gh-pages...');
            const stateRes = await fetch(PREVIOUS_STATE_URL, { cache: "no-store" });
            if (stateRes.ok) {
                const stateText = await stateRes.text();
                // Extract the URL from your JSON structure: "r": "https://..."
                const rMatch = stateText.match(/"r"\s*:\s*"([^"]+)"/);
                if (rMatch && rMatch[1]) {
                    lastKnownRulez = rMatch[1];
                    console.log(`Found previous Movierulz URL: ${lastKnownRulez}`);
                }
            }
        } catch (e) {
            console.log('Could not fetch previous state, starting from fallback.');
        }

        // --- 3. Follow Redirects to find Current Movierulz URL ---
        console.log(`Checking for redirects starting from: ${lastKnownRulez}`);
        let currentRulezUrl = lastKnownRulez;
        try {
             // Fetch follows 301/302 redirects automatically.
             // Using GET with a standard User-Agent to bypass basic bot blocks.
             const rulezRes = await fetch(lastKnownRulez, { 
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
                } 
             });
             
             // rulezRes.url contains the final URL after all redirects are finished
             currentRulezUrl = rulezRes.url; 
             console.log(`Final Movierulz URL resolved to: ${currentRulezUrl}`);
             
        } catch (e) {
             console.log(`Failed to fetch ${lastKnownRulez}, the domain might be completely dead.`);
             console.log('Reverting to fallback URL to prevent breaking the config.');
             currentRulezUrl = FALLBACK_MOVIERULZ;
        }

        // --- 4. Create JSON object ---
        const configData = {
            d: streamDomain,
            r: currentRulezUrl,
            t: new Date().toISOString() // Optional: Good for verifying when it last ran
        };

        const fileContent = `var movieData = ${JSON.stringify(configData, null, 2)};`;

        fs.writeFileSync('config.js', fileContent);
        console.log('Successfully updated config.js');

    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
}

updateConfig();
