export interface Language {
    code: string;
    name: string;
    flag: string;
  }
  
  export const languages: Language[] = [
    { code: 'en', name: 'English', flag: '/Flag_of_the_United_States.svg' },
    { code: 'he', name: 'עברית', flag: '/Flag_of_Israel.svg' },
    { code: 'es_ar', name: 'Español', flag: '/Flag_of_Argentina.svg' },
  ];