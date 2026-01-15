import api from './api'
import Cookies from 'js-cookie';

export function setAuthToken(token: string) {
  api.defaults.headers.common['Authorization'] = token;
}

export function resetAuthToken() {
  delete api.defaults.headers.common['Authorization'];
}

export function setCookie(name: string, value: string, options?: Cookies.CookieAttributes) {
  Cookies.set(name, value, options);
}

export function getCookie(name: string): string | undefined {
  return Cookies.get(name);
}

export function removeCookie(name: string) {
  if (process.env.NEXT_PUBLIC_COOKIE_DOMAIN) {
    Cookies.remove(name, { 
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN
    });
  } else {
    Cookies.remove(name);
  }
}
