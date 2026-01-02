/**
 * Configuration for Vega Stremio Addon
 */

module.exports = {
    // Addon server port
    port: process.env.PORT || 5000,

    // Vega providers repository base URL
    vegaProvidersBaseUrl: 'https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main',

    // All active providers from vega-providers manifest
    // Providers marked with disabled: true in the manifest are excluded
    enabledProviders: [
        // === GLOBAL PROVIDERS (work worldwide) ===
        { value: 'autoEmbed', displayName: 'MultiStream', description: 'Multiple streaming sources via WebStreamer and Rive', priority: 1 },
        { value: 'vega', displayName: 'VegaMovies', description: 'VegaMovies streaming', priority: 2 },
        { value: 'drive', displayName: 'MoviesDrive', description: 'MoviesDrive streaming', priority: 3 },
        { value: 'multi', displayName: 'MultiMovies', description: 'MultiMovies streaming', priority: 4 },
        { value: '4khdhub', displayName: '4khdHub', description: '4K HD Hub', priority: 5 },
        { value: '1cinevood', displayName: 'Cinewood', description: 'Cinewood streaming', priority: 6 },
        { value: 'world4u', displayName: 'World4uFree', description: 'World4uFree streaming', priority: 7 },
        { value: 'katmovies', displayName: 'KatMoviesHd', description: 'KatMoviesHd streaming', priority: 8 },
        { value: 'mod', displayName: 'MoviesMod', description: 'MoviesMod streaming', priority: 9 },
        { value: 'uhd', displayName: 'UHDMovies', description: 'UHD Movies', priority: 10 },
        { value: 'protonMovies', displayName: 'ProtonMovies', description: 'Proton Movies', priority: 11 },
        { value: 'filmyfly', displayName: 'FilmyFly', description: 'FilmyFly streaming', priority: 12 },
        { value: 'movies4u', displayName: 'Movies4U', description: 'Movies4U streaming', priority: 13 },
        { value: 'kmMovies', displayName: 'KmMovies', description: 'KM Movies', priority: 14 },
        { value: 'zeefliz', displayName: 'Zeefliz', description: 'Zeefliz streaming', priority: 15 },
        { value: 'ringz', displayName: 'Ringz', description: 'Ringz streaming', priority: 16 },
        { value: 'hdhub4u', displayName: 'HdHub4u', description: 'HD Hub 4U', priority: 17 },

        // === ENGLISH PROVIDERS ===
        { value: 'showbox', displayName: 'ShowBox', description: 'ShowBox streaming', priority: 18 },
        { value: 'ridoMovies', displayName: 'RidoMovies', description: 'Rido Movies', priority: 19 },
        { value: 'flixhq', displayName: 'FlixHQ', description: 'FlixHQ streaming', priority: 20 },
        { value: 'primewire', displayName: 'Primewire', description: 'Primewire streaming', priority: 21 },
        { value: 'hiAnime', displayName: 'HiAnime', description: 'HiAnime (Anime)', priority: 22 },
        { value: 'animetsu', displayName: 'Animetsu', description: 'Animetsu (Anime)', priority: 23 },
        { value: 'tokyoInsider', displayName: 'TokyoInsider', description: 'Tokyo Insider (Anime)', priority: 24 },
        { value: 'kissKh', displayName: 'KissKh', description: 'KissKh (K-Drama)', priority: 25 },

        // === INDIA/REGIONAL PROVIDERS ===
        { value: 'ogomovies', displayName: 'Ogomovies', description: 'Ogo Movies (India)', priority: 26 },
        { value: 'moviezwap', displayName: 'MoviezWap', description: 'MoviezWap (India)', priority: 27 },
        { value: 'luxMovies', displayName: 'RogMovies', description: 'Rog Movies (India)', priority: 28 },
        { value: 'topmovies', displayName: 'TopMovies', description: 'Top Movies (India)', priority: 29 },
        { value: 'Joya9tv', displayName: 'Joya9tv', description: 'Joya9tv (India)', priority: 30 },

        // === INTERNATIONAL PROVIDERS ===
        { value: 'guardahd', displayName: 'GuardaHD', description: 'GuardaHD (Italy)', priority: 31 },
    ],

    // Disabled providers (for reference):
    // - cinemaLuxe (disabled)
    // - movieBox (disabled)
    // - katMovieFix (disabled)
    // - netflixMirror (disabled)
    // - primeMirror (disabled)
    // - a111477 (disabled)
    // - vadapav (disabled)
    // - moviesApi (disabled)
    // - dooflix (disabled)
    // - skyMovieHD (disabled)

    // Cache settings
    cache: {
        // How long to cache provider modules (in milliseconds)
        moduleCacheExpiry: 24 * 60 * 60 * 1000, // 24 hours

        // How long to cache stream results (in milliseconds)
        streamCacheExpiry: 30 * 60 * 1000, // 30 minutes
    },

    // Request timeout settings (in milliseconds)
    timeout: {
        providerDownload: 15000,
        streamFetch: 30000,
        imdbToTmdb: 10000,
    },

    // Common headers for requests
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    },
};
