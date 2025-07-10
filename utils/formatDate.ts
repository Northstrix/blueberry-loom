export const formatDate = (date: Date, language: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    hour12: true,
  };
  let formattedDate = new Intl.DateTimeFormat(
    language === 'he' ? 'he-IL' : language === 'es' ? 'es-AR' : 'en',
    options
  ).format(date);
  if (language === 'he') {
    formattedDate = formattedDate
      .replace('AM', 'לפי')
      .replace('PM', 'אחי')
      .replace('לפני חצות', 'לפי')
      .replace('אחר חצות', 'אחי')
      .replace('לפנה׳׳צ', 'לפי')
      .replace('אחה׳׳צ', 'אחי')
      .replace('לפנהייצ', 'לפי')
      .replace('אחהייצ', 'אחי');
  }
  // Remove leading zero from hour if present
  formattedDate = formattedDate.replace(/^(\d{1}):(\d{2}):(\d{2})\s(AM|PM|לפי|אחי)/, ' $1:$2:$3 $4');
  return formattedDate;
};
