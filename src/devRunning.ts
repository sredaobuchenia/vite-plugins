import type { PluginOption } from 'vite';
import { colors } from 'utils';

/**
 * Плагин для оповещения на запуске сервера
 * @param { String } host
 * @return { PluginOption }
 */
export default function (host: string): PluginOption {
  return {
    name: 'server-start-message',
    configureServer(server) {
      server.httpServer.on('listening', () => {
        setTimeout(() => {
          const info = server.config.logger.info;
          info(
            colors.underscore +
              colors.fg.bblack +
              'Sredaobuchenia' +
              colors.reset,
            { clear: true },
          );
          info(colors.fg.green + 'Server running at: ' + colors.reset + host);
        });
      });
    },
    enforce: 'post',
  };
}
