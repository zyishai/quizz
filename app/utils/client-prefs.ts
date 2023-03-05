import { useHydrated } from 'remix-utils';

type ClientPreferences = {
  lastLessonsView?: 'calendar' | 'list';
} & Record<string, any>;

export const useClientPrefs = () => {
  const hydrated = useHydrated();

  if (hydrated) {
    const clientPrefs = JSON.parse(localStorage.getItem('client-prefs') || '{}');
    return clientPrefs as ClientPreferences;
  } else {
    return {} as ClientPreferences;
  }
}

export const commitClientPrefs = (prefs: ClientPreferences) => {
  localStorage.setItem('client-prefs', JSON.stringify(prefs));
}
