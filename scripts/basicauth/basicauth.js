import { deleteCookie, getCurrentCookie } from '../helpers.js';
import SHA256 from './sha256.js';

const EDS_AUTH_PASSWORD_COOKIE_NAME = 'eds_auth_password';

const EDS_AUTH_CONFIG_JSON_PATH = '/basicauth.json';
const EDS_AUTH_CONFIG_ST_KEY = 'config:basicauth';
const EDS_AUTH_CONFIG_AUTH_PASSWORD_KEY = 'auth-password';
const EDS_AUTH_CONFIG_AUTH_EXPIRES_KEY = 'auth-password';

// If not working, update useragent from here https://github.com/GoogleChrome/lighthouse/blob/a511e5899e90dd9b943b85901fa3c40024d6a5f1/core/config/constants.js#L83
const LIGHTHOUSE_MOBILE_USERAGENT =
  'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36';

const BasicAuth = {
  getAuthPassword: async () => BasicAuth.getConfigValue(EDS_AUTH_CONFIG_AUTH_PASSWORD_KEY),
  isAuthorized: async () => {
    /**
     * // TODO: find a better way
     * Temporary solution to disable auth when running
     * lighthouse to prevent GitHub PR PSI checks from failing
     */
    if (BasicAuth.isLighthouse()) return true;

    const authPassword = await BasicAuth.getAuthPassword();
    const cookieAuthPassword = getCurrentCookie(EDS_AUTH_PASSWORD_COOKIE_NAME);
    if (!cookieAuthPassword || cookieAuthPassword !== authPassword) {
      deleteCookie(EDS_AUTH_PASSWORD_COOKIE_NAME);
      // eslint-disable-next-line no-alert
      const password = await SHA256.hash(prompt('Please enter auth password'));

      if (password !== authPassword) {
        window.sessionStorage.removeItem(EDS_AUTH_CONFIG_ST_KEY);
        return false;
      }

      const expires = await BasicAuth.getConfigValue(EDS_AUTH_CONFIG_AUTH_EXPIRES_KEY);
      document.cookie = `${EDS_AUTH_PASSWORD_COOKIE_NAME}=${password}; path=/; Max-Age=${expires}; `;

      return true;
    }

    return true;
  },
  isLighthouse: () => navigator.userAgent === LIGHTHOUSE_MOBILE_USERAGENT,
  getConfig: async () => {
    let configJSON = window.sessionStorage.getItem(EDS_AUTH_CONFIG_ST_KEY);
    if (!configJSON) {
      const configURL = new URL(`${window.location.origin}${EDS_AUTH_CONFIG_JSON_PATH}`);
      configJSON = await fetch(configURL).then((res) => res.text());
      window.sessionStorage.setItem(EDS_AUTH_CONFIG_ST_KEY, configJSON);
    }
    return configJSON;
  },
  getConfigValue: async (key) => {
    const configJSON = await BasicAuth.getConfig();
    const configElements = JSON.parse(configJSON).data;
    return configElements.find((c) => c.key === key)?.value;
  },
};

export default BasicAuth;
