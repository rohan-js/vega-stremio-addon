const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../../config');

async function gdflixExtractor(link, signal) {
    const streams = [];
    try {
        const response = await axios.get(link, { headers: config.headers, timeout: config.timeout.streamFetch, signal });
        const $ = cheerio.load(response.data);
        const pageText = $('body').text(); // Grab full text to force find metadata

        // Force Regex: Find Size anywhere (e.g. "Size: 1.2GB" or just "1.2 GB")
        const sizeMatch = pageText.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i);
        const size = sizeMatch ? sizeMatch[1].toUpperCase() : '';

        // Force Regex: Find Quality
        const qualityMatch = pageText.match(/(\d{3,4}p)/i);
        const quality = qualityMatch ? qualityMatch[1].replace('p', '') : '';

        // Force Regex: Find Audio (Hindi, English, etc.)
        const langMatch = pageText.match(/(?:Audio|Language|Lang):\s*([^\n|]+)/i) || 
                          pageText.match(/(Hindi|English|Dual|Multi|Tamil|Telugu)/gi);

        const language = langMatch ? 
            (Array.isArray(langMatch) ? [...new Set(langMatch)].join('-') : langMatch[1].trim()) : 
            'Dual';

        const meta = { size, quality, language };

        $('a[href*="drive.google.com"]').each((_, el) => {
            const href = $(el).attr('href');
            const fileId = href.match(/\/d\/([^/]+)/)?.[1] || href.match(/id=([^&]+)/)?.[1];
            if (fileId) {
                streams.push({
                    ...meta,
                    server: 'GDrive',
                    link: `https://drive.google.com/uc?export=download&id=${fileId}`,
                    type: 'mp4'
                });
            }
        });

        $('video source, source').each((_, el) => {
            const src = $(el).attr('src');
            if (src) streams.push({ ...meta, server: 'GDflix Direct', link: src, type: 'mp4' });
        });

        $('a.btn, a[class*="download"]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('.mp4') || href.includes('.mkv'))) {
                streams.push({ ...meta, server: 'GDflix Download', link: href, type: 'mp4' });
            }
        });

    } catch (e) { console.error('GDflix Error:', e.message); }
    return streams;
}
module.exports = { gdflixExtractor };