import { FSWatcher, Plugin } from 'vite';
import * as _path from 'path';
import * as fs from 'fs';

interface Options {
  path?: string;
  directives?: string[];
}
// eslint-disable-next-line no-empty-pattern
type PluginInitFunction<T> = ({}: T) => Plugin;

let root = '';
let componentsDir = '';
let generetedFilePath = '';
let alies = [];

let directives$ = [];

const plugin: PluginInitFunction<Options> = ({
  path = 'src/components.ts',
  directives = [],
} = {}) => {
  directives$ = directives;
  const result: Plugin = {
    name: 'ide-unplug-helper',
    enforce: 'post',
    configureServer(server) {
      setupWatcher(server.watcher);
    },
    configResolved(config) {
      root = config.root;
      componentsDir = _path.resolve(root, 'src', 'app', 'components');
      generetedFilePath = _path.resolve(root, path);
      alies = config.resolve.alias;
      alies = alies
        .filter(
          ({ find, replacement }) =>
            typeof find === 'string' && typeof replacement === 'string',
        )
        .sort((a, b) => b.replacement.length - a.replacement.length);
      generate();
    },
  };
  return result;
};

/**
 * Установка наблюдения за созданием/удалением файлов
 * @param { FSWatcher } watcher
 */
function setupWatcher(watcher: FSWatcher) {
  watcher.on('unlink', () => {
    generate();
  });
  watcher.on('add', () => {
    generate();
  });
}

/**
 * Инициализация генерации файла
 */
function generate() {
  let result = makeVue() + makeSpace();
  result += makeDirectives() + makeSpace();
  result += makeComponentsRows();
  makeFile(result);
}

/**
 * Создает пробелы
 * @return { String }
 */
function makeSpace() {
  return '\n\n';
}

/**
 * Создает список с глобальными компонентами
 * @return { String }
 */
function makeComponentsRows() {
  const files = getAllFilesFromDir(componentsDir);
  const names = files.map((path) => makeName(path));
  let result = '';
  names.forEach(({ path, value }) => {
    result += makeComponentString(value, path) + '\n';
  });
  return result;
}

/**
 * Создание файла
 * @param { String } string данные
 */
function makeFile(string: string) {
  fs.writeFileSync(generetedFilePath, string, { flag: 'w' });
}

/**
 * Список .vue файлов
 * @param { string } dir
 * @return { Array }
 */
function getAllFilesFromDir(dir: string) {
  let result = [];
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach((item) => {
      const path = _path.resolve(dir, item);
      const isPathIgnored = path.search('_') > 1;

      if (isPathIgnored) return result;

      const fileInfo = fs.statSync(path);
      const ext = _path.extname(path);
      if (fileInfo.isFile() && ext === '.vue') {
        result.push(path);
      } else if (fileInfo.isDirectory()) {
        result = [...result, ...getAllFilesFromDir(path)];
      }
    });
    return result;
  } else {
    return [];
  }
}

/**
 * Генерация имен компонентов
 * @param { String } path
 * @return { Object }
 */
function makeName(path: string) {
  let value;
  const withoutRoot = path.replace(componentsDir, '');
  const parsePath = _path.parse(withoutRoot);
  const nameFromDir = parsePath.dir
    .split('/')
    .map(capitalizeFirstLetter)
    .join('');
  if (parsePath.name.toLowerCase() === 'index') {
    value = nameFromDir;
  } else {
    value = nameFromDir + capitalizeFirstLetter(parsePath.name);
  }
  let relativePath = path;
  alies.some((item) => {
    if (relativePath.search(item.replacement) > -1) {
      relativePath = relativePath.replace(item.replacement, item.find);
      return true;
    }
    return false;
  });

  return { value, path: relativePath };
}

/**
 * Строка с созданием объекта вью
 * @return { String }
 */
function makeVue() {
  return `import { createApp } from "vue";

const Vue = createApp({});`;
  // return 'import Vue from "vue"';
}

/**
 * Строка с подключением компонента
 * @param { String } name
 * @param { String } path
 * @return { String }
 */
function makeComponentString(name: string, path: string) {
  return `Vue.component('${name}', import('${path}'))`;
}

/**
 * Приведение строки к camelCase
 * @param { String } string
 * @return { String }
 */
function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Функция создает список директив из ${@link directives}
 * @return { String } directives
 */
function makeDirectives() {
  let result = '';
  directives$.forEach((key) => {
    result += `Vue.directive('${key}', {})`;
  });
  return result;
}

export default plugin;
