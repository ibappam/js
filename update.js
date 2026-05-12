const fs = require('fs');

const SOURCE_URL = 'https://allmovieland.link/player.js?v=401';

async function updateJsFile() {
    try {
        console.log(`Fetching from ${SOURCE_URL}...`);
        const res = await fetch(SOURCE_URL, { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            } 
        });
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const text = await res.text();
        const match = text.match(/AwsIndStreamDomain\s*=\s*['"]([^'"]+)['"]/);
        
        if (match) {
            const domain = match[1].replace(/\/+$/, '');
            
            // Creates the global variable your Blogger script expects
            const content = `var movieData = { d: "${domain}", t: "${Date.now()}" };`;
            
            fs.writeFileSync('config.js', content);
            console.log('Successfully updated config.js with:', domain);
        } else {
            console.error('Failed to find domain pattern in the source script.');
            process.exit(1); 
        }
    } catch (error) {
        console.error('Scrape failed:', error);
        process.exit(1); 
    }
}

updateJsFile();
