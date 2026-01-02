/**
 * Vega Stremio Addon
 * Main entry point with advanced metadata formatting and cleanup logic.
 */

const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const config = require('./config');
const { getStreamsFromAllProviders } = require('./lib/providerLoader');
const { imdbToTmdb, parseStremioId } = require('./lib/imdbToTmdb');
const { getSubtitles } = require('./lib/subtitleProvider');

const manifest = {
    id: 'org.vega.stremio.addon',
    version: '1.6.0',
    name: 'Vega Providers',
    description: 'Advanced streaming with Auto-Size detection, Multi-Language support, and Clean UI.',
    types: ['movie', 'series'],
    resources: ['stream', 'subtitles'],
    idPrefixes: ['tt'],
    catalogs: [],
    background: 'https://raw.githubusercontent.com/vega-org/vega-app/main/assets/icon.png',
    logo: 'https://raw.githubusercontent.com/vega-org/vega-app/main/assets/icon.png',
    behaviorHints: { configurable: true, configurationRequired: false },
    config: [
        { key: 'info', type: 'text', title: '--- GLOBAL PROVIDERS ---' },
        { key: 'autoEmbed', type: 'checkbox', default: 'true', title: 'MultiStream (Best for most movies)' },
        { key: 'vega', type: 'checkbox', default: 'true', title: 'VegaMovies' },
        { key: 'drive', type: 'checkbox', default: 'true', title: 'MoviesDrive' },
        { key: 'multi', type: 'checkbox', default: 'true', title: 'MultiMovies' },
        { key: '4khdhub', type: 'checkbox', default: 'true', title: '4khdHub' },
        { key: '1cinevood', type: 'checkbox', default: 'true', title: 'Cinewood' },
        { key: 'world4u', type: 'checkbox', default: 'true', title: 'World4uFree' },
        { key: 'katmovies', type: 'checkbox', default: 'true', title: 'KatMoviesHd' },
        { key: 'mod', type: 'checkbox', default: 'true', title: 'MoviesMod' },
        { key: 'uhd', type: 'checkbox', default: 'true', title: 'UHDMovies' },
        { key: 'protonMovies', type: 'checkbox', default: 'true', title: 'ProtonMovies' },
        { key: 'filmyfly', type: 'checkbox', default: 'true', title: 'FilmyFly' },
        { key: 'movies4u', type: 'checkbox', default: 'true', title: 'Movies4U' },
        { key: 'kmMovies', type: 'checkbox', default: 'true', title: 'KmMovies' },
        { key: 'zeefliz', type: 'checkbox', default: 'true', title: 'Zeefliz' },
        { key: 'ringz', type: 'checkbox', default: 'true', title: 'Ringz' },
        { key: 'hdhub4u', type: 'checkbox', default: 'true', title: 'HdHub4u' },
        { key: 'info2', type: 'text', title: '--- ENGLISH PROVIDERS ---' },
        { key: 'showbox', type: 'checkbox', default: 'true', title: 'ShowBox' },
        { key: 'ridoMovies', type: 'checkbox', default: 'true', title: 'RidoMovies' },
        { key: 'flixhq', type: 'checkbox', default: 'true', title: 'FlixHQ' },
        { key: 'primewire', type: 'checkbox', default: 'true', title: 'Primewire' },
        { key: 'hiAnime', type: 'checkbox', default: 'true', title: 'HiAnime (Anime)' },
        { key: 'animetsu', type: 'checkbox', default: 'true', title: 'Animetsu (Anime)' },
        { key: 'tokyoInsider', type: 'checkbox', default: 'true', title: 'TokyoInsider (Anime)' },
        { key: 'kissKh', type: 'checkbox', default: 'true', title: 'KissKh (K-Drama)' },
        { key: 'info3', type: 'text', title: '--- INDIA/REGIONAL PROVIDERS ---' },
        { key: 'ogomovies', type: 'checkbox', default: 'true', title: 'Ogomovies (India)' },
        { key: 'moviezwap', type: 'checkbox', default: 'true', title: 'MoviezWap (India)' },
        { key: 'luxMovies', type: 'checkbox', default: 'true', title: 'RogMovies (India)' },
        { key: 'topmovies', type: 'checkbox', default: 'true', title: 'TopMovies (India)' },
        { key: 'Joya9tv', type: 'checkbox', default: 'true', title: 'Joya9tv (India)' },
        { key: 'guardahd', type: 'checkbox', default: 'true', title: 'GuardaHD (Italy)' },
    ],
};

const builder = new addonBuilder(manifest);

/**
 * CLEANER UTILITIES
 */

// 1. Sanitize Provider Name
const cleanProviderName = (name) => {
    if (!name) return 'Vega';
    return name
        .split(/[-!|]/)[0] // Remove everything after separators like - or !
        .replace(/WebStreamr|Direct|Server|Link|Cloud/gi, '') // Remove generic junk words
        .trim();
};

// 2. Advanced Title Formatter
const formatStreamTitle = (stream, cleanQuality) => {
    const provider = cleanProviderName(stream.providerName);

    // Metadata parts
    const size = stream.size ? `💾 ${stream.size}` : '';
    const audio = stream.language && stream.language !== 'Multi' ? `🗣️ ${stream.language}` : '';
    const quality = cleanQuality ? `✨ ${cleanQuality}` : '';
    const subIcon = (stream.subtitles && stream.subtitles.length > 0) ? '🔤' : '';

    // Determine Quality Emoji
    const qVal = parseInt(cleanQuality);
    let qEmoji = '⭐';
    if (qVal >= 2160) qEmoji = '🔥'; // 4K
    else if (qVal >= 1080) qEmoji = '💎'; // 1080p

    // Construct the metadata bar (e.g. "✨ 1080p | 🗣️ Hindi | 💾 1.2 GB")
    const metaBar = [quality, audio, size, subIcon]
        .filter(part => part && part.trim() !== '') // Remove empty parts
        .join(' | ');

    // Main line: "💎 MultiStream | ✨ 1080p | 💾 1.5 GB"
    let title = `${qEmoji} ${provider} | ${metaBar}`;

    // Add server info ONLY if it's different/useful
    if (stream.server) {
        const cleanServer = stream.server.replace(/Server|Link|cdn/gi, '').trim();
        // Check similarity to prevent "Provider: Vega, Server: Vega"
        if (cleanServer.toLowerCase() !== provider.toLowerCase() && cleanServer.length > 2) {
            title += `\n🖥️ ${cleanServer}`;
        }
    }

    return title;
};

builder.defineStreamHandler(async (args) => {
    // Handle configuration
    const userConfig = args.config || {};
    let enabledProvidersList = config.enabledProviders;
    if (Object.keys(userConfig).length > 0) {
        enabledProvidersList = config.enabledProviders.filter(p => {
            const val = userConfig[p.value];
            return val === 'true' || val === 'on' || val === true || val === undefined;
        });
    }

    try {
        const { imdbId, season, episode } = parseStremioId(args.id);
        const type = args.type === 'series' ? 'series' : 'movie';
        const tmdbId = await imdbToTmdb(imdbId, type);

        if (!tmdbId && !imdbId) return { streams: [] };

        const vegaStreams = await getStreamsFromAllProviders(
            { imdbId, tmdbId: tmdbId || '', type, season: season || '', episode: episode || '' }, 
            enabledProvidersList
        );

        const stremioStreams = vegaStreams.map((stream) => {
            // Fix double quality issue (e.g. "2160p[2160p]" -> "2160p")
            const qMatch = (stream.quality || 'HD').toString().match(/\d{3,4}/);
            const cleanQ = qMatch ? `${qMatch[0]}p` : 'HD';

            const provider = cleanProviderName(stream.providerName);

            return {
                name: `${provider}\n${cleanQ}`, // Compact Name for left column
                title: formatStreamTitle(stream, cleanQ), // Rich Description
                url: stream.link,
                behaviorHints: {
                    notWebReady: true,
                    proxyHeaders: stream.headers ? { request: stream.headers } : undefined
                },
                subtitles: stream.subtitles ? stream.subtitles.map((sub, index) => ({
                    id: `${stream.providerValue || 'vega'}-sub-${index}`,
                    url: sub.uri || sub.url || sub.link,
                    lang: sub.language || sub.lang || 'eng',
                })).filter(sub => sub.url) : []
            };
        });

        // Sort: 4K first, then 1080p
        stremioStreams.sort((a, b) => {
            const getQ = (s) => parseInt(s.name.match(/\d{3,4}/)?.[0] || '0');
            return getQ(b) - getQ(a);
        });

        return { streams: stremioStreams.filter(s => s.url) };

    } catch (error) {
        console.error('Stream Handler Error:', error);
        return { streams: [] };
    }
});

builder.defineSubtitlesHandler(async (args) => {
    try {
        const { imdbId, season, episode } = parseStremioId(args.id);
        const subtitles = await getSubtitles(imdbId, args.type, season, episode);
        return { subtitles: subtitles || [] };
    } catch (e) { return { subtitles: [] }; }
});

const port = config.port || 7000;
serveHTTP(builder.getInterface(), { port });