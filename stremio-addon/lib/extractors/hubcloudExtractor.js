const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../../config');
const fetch = global.fetch || require('node-fetch');

// Advanced Meta Parser - Forcefully extracts Size, Quality, Language
function getMetaFromText(text) {
    if (!text) return { size: '', quality: '', language: 'Multi' };

    // Size: Matches 1.2GB, 1.2 GB, 1.2GiB, 100MB, etc.
    const sizeMatch = text.match(/(\d+(?:\.\d+)?\s*(?:GB|GiB|MB|MiB))/i);

    // Quality: 2160p, 1080p, 4k, etc.
    const qualityMatch = text.match(/(\d{3,4}p|4k|2k|uhd|hd)/i);
    let quality = qualityMatch ? qualityMatch[1].replace(/p|k/gi, '') : '';

    // Normalize 4k to 2160
    if (text.match(/4k|uhd/i) || quality === '4') quality = '2160';
    if (!quality && text.match(/1080/)) quality = '1080';
    if (!quality && text.match(/720/)) quality = '720';
    if (!quality && text.match(/480/)) quality = '480';
    if (quality) quality += 'p'; // Ensure 'p' suffix for consistency

    // Language
    const langMatch = text.match(/(Hindi|English|Eng|Dual|Multi|Tamil|Telugu|Malayalam|Kannada)/gi);

    return {
        size: sizeMatch ? sizeMatch[1].toUpperCase().replace('GIB', 'GB').replace('MIB', 'MB') : '',
        quality: quality,
        language: langMatch ? [...new Set(langMatch)].join('-') : 'Multi'
    };
}

// Helper to decode base64
function decode(value) {
    if (!value) return '';
    try { return Buffer.from(value, 'base64').toString('utf-8'); } catch { return ''; }
}

async function hubcloudExtractor(link, signal) {
    try {
        console.log('    hubcloudExtractor:', link);
        const baseUrl = link.split('/').slice(0, 3).join('/');

        // Handle oxxfile/filepress separately
        if (link.includes('oxxfile') || link.includes('filepress')) {
            return await extractFromOxxfile(link, signal);
        }

        const response = await axios.get(link, { headers: config.headers, timeout: config.timeout.streamFetch, signal });
        const $ = cheerio.load(response.data);

        // 1. Forceful Metadata Scan
        // Check multiple sources: specific classes, title, or full body text
        let metaText = $('.file-name, .name, h2, h3, title').text();
        if (!metaText || metaText.length < 20) {
            metaText += " " + $('body').text().substring(0, 1500); // Scan first 1500 chars of body
        }

        const commonMeta = getMetaFromText(metaText);

        // Find redirect URL
        const redirectUrlMatch = response.data.match(/var\s+url\s*=\s*'([^']+)';/);
        let vcloudLink = redirectUrlMatch ? redirectUrlMatch[1] : link;

        // Decode if needed
        if (vcloudLink.includes('r=')) {
             try { vcloudLink = decode(vcloudLink.split('r=')[1]); } catch (e) {}
        } else if (!redirectUrlMatch) {
             // Fallback: try to find download button directly on hubcloud page
             vcloudLink = $('.fa-file-download.fa-lg').parent().attr('href') || link;
        }

        if (vcloudLink.startsWith('/')) {
            vcloudLink = `${baseUrl}${vcloudLink}`;
        }

        // Fetch the VCloud/Hubcloud page
        const vcloudRes = await fetch(vcloudLink, { headers: config.headers, signal });
        const $vcloud = cheerio.load(await vcloudRes.text());

        const streamLinks = [];
        const seenLinks = new Set(); // To prevent duplicates

        $vcloud('a.btn, .btn-primary, .btn-success, .btn-danger').each((_, el) => {
            const href = $vcloud(el).attr('href');
            const btnText = $vcloud(el).text();

            if (href && !href.startsWith('javascript') && !href.startsWith('#') && !seenLinks.has(href)) {
                seenLinks.add(href);

                const btnMeta = getMetaFromText(btnText);

                // Merge logic: Prefer button meta, fallback to page meta
                // This ensures if size is on button, we take it. If not, we take from page.
                const finalSize = btnMeta.size || commonMeta.size;
                const finalQuality = btnMeta.quality || commonMeta.quality;
                const finalLang = btnMeta.language !== 'Multi' ? btnMeta.language : commonMeta.language;

                // Determine Server Name
                let server = 'Hubcloud';
                if (href.includes('pixeldrain')) server = 'Pixeldrain';
                else if (href.includes('drive.google')) server = 'GDrive';
                else if (href.includes('workers.dev')) server = 'CF Worker';
                else if (href.includes('gofile')) server = 'Gofile';
                else if (href.includes('wish')) server = 'StreamWish';
                else if (btnText.includes('Download')) server = 'Direct';

                streamLinks.push({
                    server: server,
                    link: href,
                    size: finalSize,
                    quality: finalQuality,
                    language: finalLang
                });
            }
        });

        return streamLinks;
    } catch (e) {
        console.error('Hubcloud Error:', e.message);
        return [];
    }
}

/**
 * Extract streams from Oxxfile/Filepress links with metadata
 */
async function extractFromOxxfile(link, signal) {
    const streamLinks = [];
    try {
        const response = await axios.get(link, {
            headers: config.headers,
            timeout: config.timeout.streamFetch,
            signal: signal,
        });

        const $ = cheerio.load(response.data);

        // Scan metadata
        const pageTitle = $('title').text() + " " + $('.card-body').text();
        const commonMeta = getMetaFromText(pageTitle);

        $('a.btn, a[class*="download"], a[href*=".mkv"], a[href*=".mp4"]').each((_, el) => {
            const href = $(el).attr('href');
            const txt = $(el).text();

            if (href && (href.includes('.mkv') || href.includes('.mp4') || href.includes('download'))) {
                const btnMeta = getMetaFromText(txt);

                streamLinks.push({
                    server: 'Oxxfile',
                    link: href.startsWith('http') ? href : `${link.split('/').slice(0, 3).join('/')}${href}`,
                    type: 'mkv',
                    size: btnMeta.size || commonMeta.size,
                    quality: btnMeta.quality || commonMeta.quality,
                    language: btnMeta.language || commonMeta.language
                });
            }
        });

        return streamLinks;
    } catch (error) {
        return [];
    }
}

module.exports = { hubcloudExtractor };