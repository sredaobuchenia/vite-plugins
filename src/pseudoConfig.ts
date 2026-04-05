import { PluginOption } from 'vite';

const IMPORT_CONFIG_PATH = '/config/config.json';
const REPLACEMENT_PATH = '@/utils/config.ts';
const REPLACEMENT_STRING =
  'import configRef from "@path";\nconst config = configRef.value;\n';

/**
 * Плагин для подмены конфигурации
 * @param { String } path путь у импорта который нужно заменить
 * @param { String } replacePath путь к конфигурационному файлу
 * @return { PluginOption }
 */
export default function (
  path = IMPORT_CONFIG_PATH,
  replacePath = REPLACEMENT_PATH,
): PluginOption {
  return {
    name: 'transform-config-import',

    transform(code) {
      let result = code;

      const regExp = new RegExp(`import.*${path}.*\\n`, 'ig');
      const matched = code.match(regExp);

      if (matched) {
        matched.forEach((string) => {
          result = result.replace(
            string,
            REPLACEMENT_STRING.replace('@path', replacePath),
          );
        });
        return result;
      }
      return null;
    },
  };
}
