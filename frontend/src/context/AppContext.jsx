import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );
  const [lang, setLangState] = useState(
    () => localStorage.getItem('lang') || 'tr'
  );
  const [translations, setTranslations] = useState({});
  const [meta, setMeta] = useState({ githubUrl: '', footerText: '' });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    import(`../locales/${lang}.json`)
      .then((mod) => setTranslations(mod.default))
      .catch(() => {});
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    axios.get('/pm2/master/api/settings', { withCredentials: true })
      .then((res) => setMeta(res.data.meta || {}))
      .catch(() => {});
  }, []);

  function t(key) {
    return translations[key] || key;
  }

  function setTheme(val) { setThemeState(val); }
  function setLang(val) { setLangState(val); }

  return (
    <AppContext.Provider value={{ theme, setTheme, lang, setLang, t, meta, setMeta }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
