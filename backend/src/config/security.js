const TEST_JWT_SECRET = 'super_secret_jwt_key_123!@#';
const TEST_SESSION_SECRET = 'super_secret_session_key_987!@#';

const getRequiredSecret = (name) => {
    const value = process.env[name];
    if (value) return value;

    if (process.env.NODE_ENV === 'test') {
        return name === 'JWT_SECRET' ? TEST_JWT_SECRET : TEST_SESSION_SECRET;
    }

    throw new Error(`${name} must be configured before starting the server`);
};

const getAllowedOrigins = () => {
    const configuredOrigins = (process.env.FRONTEND_URL || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (process.env.NODE_ENV === 'production' && configuredOrigins.length === 0) {
        throw new Error('FRONTEND_URL must be configured in production');
    }

    return configuredOrigins;
};

module.exports = {
    getRequiredSecret,
    getAllowedOrigins
};
