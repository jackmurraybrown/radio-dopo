// Type definitions for the application

/**
 * @typedef {Object} Translation
 * @property {string} languages_code
 * @property {string} title
 * @property {string} description
 * @property {string} content
 */

/**
 * @typedef {Object} Show
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} frequency
 * @property {string} image
 * @property {Translation[]} translations
 * @property {Genre[]} genres
 */

/**
 * @typedef {Object} Genre
 * @property {string} id
 * @property {string} slug
 * @property {{name: string, languages_code: string}[]} translations
 */

/**
 * @typedef {Object} Episode
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * @property {string} start
 * @property {string} audio
 * @property {Show} show
 * @property {Translation[]} translations
 * @property {Genre[]} genres
 */

/**
 * @typedef {Object} AudioPlayerState
 * @property {'live' | 'episode'} mode
 * @property {boolean} isPlaying
 * @property {Episode | null} currentEpisode
 * @property {number} currentTime
 * @property {number} duration
 */

/**
 * @typedef {Object} AboutPage
 * @property {string} id
 * @property {Translation[]} translations
 */

/**
 * @typedef {Object} PartnersPage
 * @property {string} id
 * @property {Translation[]} translations
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * @property {string} image
 * @property {Translation[]} translations
 */

export { };