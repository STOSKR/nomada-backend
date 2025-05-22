/**
 * Utilidad para mostrar mensajes estilizados en la consola
 */

// Colores ANSI para la consola
const colors = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    reset: "\x1b[0m",
    // Estilos
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underline: "\x1b[4m",
    // Fondos
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m"
};

// Íconos para diferentes tipos de mensajes
const icons = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
    server: "⚡",
    database: "🗄️",
    api: "🔌",
    user: "👤",
    security: "🔒"
};

/**
 * Crea un cuadro con texto en la consola
 * @param {string} text - Texto a mostrar
 * @param {string} color - Color del borde
 * @param {number} padding - Relleno adicional
 */
const box = (text, color = colors.blue, padding = 2) => {
    const lines = text.split('\n');
    const width = Math.max(...lines.map(line => line.length)) + padding * 2;

    const top = `┌${"─".repeat(width)}┐`;
    const bottom = `└${"─".repeat(width)}┘`;

    console.log(color + top + colors.reset);

    lines.forEach(line => {
        const spaces = " ".repeat(width - line.length);
        console.log(`${color}│${colors.reset} ${line}${spaces} ${color}│${colors.reset}`);
    });

    console.log(color + bottom + colors.reset);
};

/**
 * Muestra un mensaje de éxito en la consola
 * @param {string} message - Mensaje a mostrar
 */
const success = (message) => {
    console.log(`\n${colors.green}${icons.success} ${colors.bold}${message}${colors.reset}\n`);
};

/**
 * Muestra un mensaje de error en la consola
 * @param {string} message - Mensaje a mostrar
 * @param {Error} [error] - Error opcional para mostrar detalles
 */
const error = (message, error = null) => {
    console.error(`\n${colors.red}${icons.error} ${colors.bold}${message}${colors.reset}`);

    if (error) {
        box(error.message, colors.red);
        if (process.env.NODE_ENV === 'development' && error.stack) {
            console.error(`${colors.dim}${error.stack}${colors.reset}\n`);
        }
    }

    console.log('');
};

/**
 * Muestra un mensaje de advertencia en la consola
 * @param {string} message - Mensaje a mostrar
 */
const warning = (message) => {
    console.log(`\n${colors.yellow}${icons.warning} ${colors.bold}${message}${colors.reset}\n`);
};

/**
 * Muestra un mensaje informativo en la consola
 * @param {string} message - Mensaje a mostrar
 */
const info = (message) => {
    console.log(`\n${colors.cyan}${icons.info} ${colors.bold}${message}${colors.reset}\n`);
};

/**
 * Muestra información del servidor en la consola
 * @param {object} options - Opciones de configuración
 * @param {string} options.host - Nombre del host
 * @param {string|number} options.port - Número de puerto
 */
const serverStarted = ({ host, port }) => {
    console.log(`\n${colors.green}${icons.success} ${colors.bold}NOMADA BACKEND${colors.reset}`);
    box(
        `${colors.bold}Servidor: ${colors.reset}${colors.cyan}http://${host}:${port}${colors.reset}\n` +
        `${colors.bold}Documentación: ${colors.reset}${colors.cyan}http://${host}:${port}/documentacion${colors.reset}`,
        colors.blue
    );
    console.log(`${colors.yellow}${icons.server} Servidor listo para recibir peticiones${colors.reset}\n`);
};

module.exports = {
    colors,
    icons,
    box,
    success,
    error,
    warning,
    info,
    serverStarted
}; 