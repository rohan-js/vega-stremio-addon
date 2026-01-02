/**
 * Gofile Extractor
 * Extracts download links with precise Size (MB/GB), Quality, and Language metadata.
 */

const axios = require('axios');
const config = require('../../config');

/**
 * Extract download link and metadata from Gofile
 * @param {string} id - The Gofile content ID
 * @returns {Promise<Array|Object>} - Array of stream objects with metadata
 */
async function gofileExtractor(id) {
    try {
        // Step 1: Create Guest Account Token
        const accountResponse = await axios.get('https://api.gofile.io/createAccount', {
            headers: config.headers,
            timeout: config.timeout.streamFetch,
        });

        const token = accountResponse.data?.data?.token;
        if (!token) {
            throw new Error('Failed to get Gofile token');
        }

        // Step 2: Fetch Content Details
        const contentResponse = await axios.get(`https://api.gofile.io/getContent?contentId=${id}&token=${token}&wt=4fd6sg89d7s6`, {
            headers: {
                ...config.headers,
                'Cookie': `accountToken=${token}`,
            },
            timeout: config.timeout.streamFetch,
        });

        const contents = contentResponse.data?.data?.contents;
        if (!contents || Object.keys(contents).length === 0) {
            throw new Error('No content found');
        }

        // Step 3: Process files and extract metadata
        const streams = Object.values(contents).map(file => {
            // Quality Detection (from filename)
            const qMatch = file.name.match(/(\d{3,4}p)/i);
            const quality = qMatch ? qMatch[1].replace('p', '') : 'HD';

            // Language Detection (common audio labels in filename)
            const langMatch = file.name.match(/(Hindi|English|Eng|Dual|Multi|Tamil|Telugu)/gi);
            const language = langMatch ? [...new Set(langMatch)].join('-') : 'Multi Audio';

            // Size Conversion (Bytes to MB/GB)
            const sizeInBytes = file.size || 0;
            let sizeDisplay = '';

            if (sizeInBytes >= 1073741824) { // Larger than 1 GB
                sizeDisplay = (sizeInBytes / 1073741824).toFixed(2) + ' GB';
            } else { // MB
                sizeDisplay = (sizeInBytes / 1048576).toFixed(2) + ' MB';
            }

            return {
                server: 'Gofile',
                link: file.link,
                size: sizeDisplay,
                quality: quality,
                language: language,
                fileName: file.name
            };
        });

        // Return all streams if multiple files exist, otherwise just the one
        return streams.length > 1 ? streams : streams[0];

    } catch (error) {
        console.error('Gofile extractor error:', error.message);
        return { link: '', size: '', quality: '', language: '' };
    }
}

module.exports = { gofileExtractor };