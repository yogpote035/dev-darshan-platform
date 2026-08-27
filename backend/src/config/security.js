const TEST_JWT_SECRET = 'super_secret_jwt_key_123!@#';
const PRODUCTION_FRONTEND_ORIGINS = [
    'https://devdarshanlive.com',
    'https://www.devdarshanlive.com',
    'https://api.devdarshanlive.com'
];

const normalizeOrigin = (value) => {
    try {
        const origin = new URL(String(value || '').trim()).origin;
        return /^https?:\/\/[^/]+$/.test(origin) ? origin : null;
    } catch (_) {
        return null;
    }
};

const getRequiredSecret = (name) => {
    const value = process.env[name];
    if (value) return value;

    if (process.env.NODE_ENV === 'test') {
        return TEST_JWT_SECRET;
    }

    throw new Error(`${name} must be configured before starting the server`);
};

const getAllowedOrigins = () => {
    const configuredOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
        .filter(Boolean)
        .join(',')
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean);

    const backendUrl = process.env.BACKEND_URL?.trim();
    if (backendUrl) {
        const normalizedBackendUrl = normalizeOrigin(backendUrl);
        if (normalizedBackendUrl) configuredOrigins.push(normalizedBackendUrl);
    }

    if (process.env.NODE_ENV === 'production') {
        configuredOrigins.push(...PRODUCTION_FRONTEND_ORIGINS);
    }

    if (process.env.NODE_ENV !== 'production') {
        const port = process.env.PORT || 5000;
        configuredOrigins.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
    }

    const uniqueOrigins = [...new Set(configuredOrigins)];
    return uniqueOrigins;
};

module.exports = {
    getRequiredSecret,
    getAllowedOrigins,
    normalizeOrigin
};
