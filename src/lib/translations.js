// Simple translations object
export const translations = {
  en: {
    nav_home: "Home",
    nav_shows: "Shows",
    nav_episodes: "Episodes",
    nav_about: "About",
    nav_partners: "Partners",
    nav_schedule: "Schedule",
    page_shows: "Shows",
    page_episodes: "EPISODES",
    page_about: "ABOUT",
    page_partners: "PARTNERS",
    weekly_schedule: "WEEKLY SCHEDULE",
    search_placeholder: "Search shows by title, frequency, or description...",
    search_no_results: "No shows found matching \"{query}\"",
    search_clear: "Clear search",
    search: "Search",
    episodes_no_available: "No episodes available yet.",
    lang_en: "EN",
    lang_it: "IT",
    menu: "MENU",
    schedule: "SCHEDULE",
    view_archive: "View Archive",
    archive: "ARCHIVE",
    featured_episodes: "Featured Episodes"
  },
  it: {
    nav_home: "Home",
    nav_shows: "Programmi",
    nav_episodes: "Episodi",
    nav_about: "Chi Siamo",
    nav_partners: "Partner",
    nav_schedule: "Palinsesto",
    page_shows: "Programmi",
    page_episodes: "EPISODI",
    page_about: "CHI SIAMO",
    page_partners: "PARTNER",
    weekly_schedule: "Palinsesto",
    search_placeholder: "Cerca programmi per titolo, frequenza o descrizione...",
    search_no_results: "Nessun programma trovato per \"{query}\"",
    search_clear: "Cancella ricerca",
    search: "Cerca",
    episodes_no_available: "Nessun episodio disponibile.",
    lang_en: "EN",
    lang_it: "IT",
    menu: "MENU",
    schedule: "PALINSESTO",
    view_archive: "Vedi Archivio",
    archive: "ARCHIVIO",
    featured_episodes: "In Primo Piano"
  }
};

// Helper function to get translation
export function t(key, lang = 'en', params = {}) {
  let text = translations[lang]?.[key] || translations.en[key] || key;

  // Replace parameters like {query}
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });

  return text;
}
