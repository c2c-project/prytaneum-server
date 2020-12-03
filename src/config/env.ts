import dotenv from 'dotenv';

dotenv.config();
const { env } = process;

export const defaults = {
    NODE_ENV: 'development',
    PORT: '3000',
    ORIGIN: 'localhost',
    DB_URL: 'mongodb://localhost:27017',
    JWT_SECRET: 'secret',
    COOKIE_SECRET: 'secret',
    DEBUG: '*',
} as Readonly<Required<NodeJS.ProcessEnv>>;

function set(key: keyof NodeJS.ProcessEnv): string {
    const environmentVar = env[key];
    const envDefault = defaults[key];
    if (envDefault === undefined) {
        throw new Error('Provided invalid environment variable name');
    }
    if (environmentVar === undefined) {
        // eslint-disable-next-line no-console
        console.warn(
            `WARN: Environment variable "${key}" is not defined, using value "${envDefault}".\n
            Please define "${key}" in your .env file`
        );
    }
    return environmentVar || envDefault;
}

const resilientEnv = {
    NODE_ENV: set('NODE_ENV'),
    PORT: set('PORT'),
    ORIGIN: set('ORIGIN'),
    DB_URL: set('DB_URL'),
    JWT_SECRET: set('JWT_SECRET'),
    COOKIE_SECRET: set('COOKIE_SECRET'),
    DEBUG: set('DEBUG'),
} as Required<NodeJS.ProcessEnv>;

export default resilientEnv as Readonly<Required<NodeJS.ProcessEnv>>;

export const _test = {
    env: resilientEnv,
} as { env: NodeJS.ProcessEnv };

function checkEnv() {
    if (env.COOKIE_SECRET === defaults.COOKIE_SECRET) {
        throw new Error('COOKIE_SECRET IS SET INCORRECTLY IN PRODUCTION!');
    }
    if (env.JWT_SECRET === defaults.JWT_SECRET) {
        throw new Error('JWT_SECRET IS SET INCORRECTLY IN PRODUCTION!');
    }
}

if (env.NODE_ENV === 'production') {
    checkEnv();
}
