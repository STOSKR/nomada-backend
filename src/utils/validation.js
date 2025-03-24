/**
 * Utilidades de validación
 * 
 * Funciones comunes para validación de datos en toda la aplicación
 */

/**
 * Validar formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido, false en caso contrario
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar longitud de contraseña
 * @param {string} password - Contraseña a validar
 * @param {number} minLength - Longitud mínima (por defecto 8)
 * @returns {boolean} - True si es válida, false en caso contrario
 */
function isValidPassword(password, minLength = 8) {
  return typeof password === 'string' && password.length >= minLength;
}

/**
 * Validar formato de nombre de usuario
 * @param {string} username - Nombre de usuario a validar
 * @returns {boolean} - True si es válido, false en caso contrario
 */
function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validar formato de fecha (YYYY-MM-DD)
 * @param {string} dateString - Fecha a validar
 * @returns {boolean} - True si es válida, false en caso contrario
 */
function isValidDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validar si un objeto tiene todas las propiedades requeridas
 * @param {Object} obj - Objeto a validar
 * @param {Array<string>} requiredProps - Lista de propiedades requeridas
 * @returns {boolean} - True si tiene todas las propiedades, false en caso contrario
 */
function hasRequiredProperties(obj, requiredProps) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return requiredProps.every(prop => 
    Object.prototype.hasOwnProperty.call(obj, prop) && 
    obj[prop] !== undefined && 
    obj[prop] !== null
  );
}

/**
 * Sanitizar string para prevenir inyección
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/[&<>"']/g, (match) => {
      const replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return replacements[match];
    })
    .trim();
}

/**
 * Validar código ISO de país (2 letras)
 * @param {string} countryCode - Código de país a validar
 * @returns {boolean} - True si es válido, false en caso contrario
 */
function isValidCountryCode(countryCode) {
  return /^[A-Z]{2}$/.test(countryCode);
}

/**
 * Validar si un ID parece ser un UUID válido
 * @param {string} id - ID a validar
 * @returns {boolean} - True si parece un UUID válido, false en caso contrario
 */
function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidDate,
  hasRequiredProperties,
  sanitizeString,
  isValidCountryCode,
  isValidUUID
}; 