const TEST_JWT_SECRET = 'super_secret_jwt_key_123!@#';
const TEST_SESSION_SECRET = 'super_secret_session_key_987!@#';
const PRODUCTION_FRONTEND_ORIGINS = [
    'https://devdarshanlive.com',
    'https://www.devdarshanlive.com',
    'https://api.devdarshanlive.com'
];

const getRequiredSecret = (name) => {
    const value = process.env[name];
    if (value) return value;

    if (process.env.NODE_ENV === 'test') {
        return name === 'JWT_SECRET' ? TEST_JWT_SECRET : TEST_SESSION_SECRET;
    }

    throw new Error(`${name} must be configured before starting the server`);
};

const getAllowedOrigins = () => {
    const configuredOrigins = (process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '')
        .split(',')
        .map((origin) => origin.trim())
        .map((origin) => origin.replace(/\/$/, ''))
        .filter((origin) => /^https?:\/\/[^/]+$/.test(origin))
        .filter(Boolean);

    const backendUrl = process.env.BACKEND_URL?.trim();
    if (backendUrl) configuredOrigins.push(backendUrl.replace(/\/$/, ''));

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
    getAllowedOrigins
};
