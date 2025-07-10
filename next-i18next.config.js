import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: require('./public/locales/en/translation.json'), // English translation
      },
      he: {
        translation: require('./public/locales/he/translation.json'), // Hebrew translation
      },
      es: {
        translation: require('./public/locales/es/translation.json'), // Latin American Spanish translation
      },
      de: {
        translation: require('./public/locales/de/translation.json'), // German translation
      },
      fr: {
        translation: require('./public/locales/fr/translation.json'), // French translation
      },
      it: {
        translation: require('./public/locales/it/translation.json'), // Italian translation
      },
      pt: {
        translation: require('./public/locales/pt/translation.json'), // Brazilian Portuguese translation
      },
      pl: {
        translation: require('./public/locales/pl/translation.json'), // Polish translation
      },
      yue: {
        translation: require('./public/locales/yue/translation.json'), // Cantonese translation
      }
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
  });

export default i18n;
