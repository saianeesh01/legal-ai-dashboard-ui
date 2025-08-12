/**
 * Database Configuration
 * Centralized configuration for database connections and settings
 */

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    sslMode: 'disable' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';
    maxConnections: number;
    minConnections: number;
    connectionTimeout: number;
    idleTimeout: number;
    retryAttempts: number;
    retryDelay: number;
}

export function getDatabaseConfig(): DatabaseConfig {
    // Production configuration
    if (process.env.NODE_ENV === 'production') {
        return {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'legal_ai_db',
            username: process.env.DB_USER || 'legal_ai_user',
            password: process.env.DB_PASSWORD || 'legal_ai_password',
            ssl: process.env.DB_SSL === 'true',
            sslMode: (process.env.DB_SSL_MODE as any) || 'prefer',
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '50'),
            minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
            connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
            idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
            retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '5'),
            retryDelay: parseInt(process.env.DB_RETRY_DELAY || '2000')
        };
    }

    // Development configuration
    return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'legal_ai_db',
        username: process.env.DB_USER || 'legal_ai_user',
        password: process.env.DB_PASSWORD || 'legal_ai_password',
        ssl: false, // Disable SSL for local development
        sslMode: 'disable',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000')
    };
}

export function buildConnectionString(config: DatabaseConfig): string {
    const baseUrl = `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;

    if (config.sslMode === 'disable') {
        return baseUrl;
    }

    return `${baseUrl}?sslmode=${config.sslMode}`;
}

export function validateDatabaseConfig(config: DatabaseConfig): string[] {
    const errors: string[] = [];

    if (!config.host) errors.push('DB_HOST is required');
    if (!config.database) errors.push('DB_NAME is required');
    if (!config.username) errors.push('DB_USER is required');
    if (!config.password) errors.push('DB_PASSWORD is required');

    if (config.port < 1 || config.port > 65535) {
        errors.push('DB_PORT must be between 1 and 65535');
    }

    if (config.maxConnections < config.minConnections) {
        errors.push('DB_MAX_CONNECTIONS must be greater than or equal to DB_MIN_CONNECTIONS');
    }

    return errors;
}

