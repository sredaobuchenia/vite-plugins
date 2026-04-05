'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _path = require('path');
var fs = require('fs');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var _path__namespace = /*#__PURE__*/_interopNamespace(_path);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        crimson: '\x1b[38m',
        bblack: '\x1b[90m',
    },
    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
        crimson: '\x1b[48m',
    },
};

function devRunning (host) {
    return {
        name: 'server-start-message',
        configureServer(server) {
            server.httpServer.on('listening', () => {
                setTimeout(() => {
                    const info = server.config.logger.info;
                    info(colors.underscore +
                        colors.fg.bblack +
                        'Sredaobuchenia' +
                        colors.reset, { clear: true });
                    info(colors.fg.green + 'Server running at: ' + colors.reset + host);
                });
            });
        },
        enforce: 'post',
    };
}

let root = '';
let componentsDir = '';
let generetedFilePath = '';
let alies = [];
let directives$ = [];
const plugin = ({ path = 'src/components.ts', directives = [], } = {}) => {
    directives$ = directives;
    const result = {
        name: 'ide-unplug-helper',
        enforce: 'post',
        configureServer(server) {
            setupWatcher(server.watcher);
        },
        configResolved(config) {
            root = config.root;
            componentsDir = _path__namespace.resolve(root, 'src', 'app', 'components');
            generetedFilePath = _path__namespace.resolve(root, path);
            alies = config.resolve.alias;
            alies = alies
                .filter(({ find, replacement }) => typeof find === 'string' && typeof replacement === 'string')
                .sort((a, b) => b.replacement.length - a.replacement.length);
            generate();
        },
    };
    return result;
};
function setupWatcher(watcher) {
    watcher.on('unlink', () => {
        generate();
    });
    watcher.on('add', () => {
        generate();
    });
}
function generate() {
    let result = makeVue() + makeSpace();
    result += makeDirectives() + makeSpace();
    result += makeComponentsRows();
    makeFile(result);
}
function makeSpace() {
    return '\n\n';
}
function makeComponentsRows() {
    const files = getAllFilesFromDir(componentsDir);
    const names = files.map((path) => makeName(path));
    let result = '';
    names.forEach(({ path, value }) => {
        result += makeComponentString(value, path) + '\n';
    });
    return result;
}
function makeFile(string) {
    fs__namespace.writeFileSync(generetedFilePath, string, { flag: 'w' });
}
function getAllFilesFromDir(dir) {
    let result = [];
    if (fs__namespace.existsSync(dir)) {
        const files = fs__namespace.readdirSync(dir);
        files.forEach((item) => {
            const path = _path__namespace.resolve(dir, item);
            const isPathIgnored = path.search('_') > 1;
            if (isPathIgnored)
                return result;
            const fileInfo = fs__namespace.statSync(path);
            const ext = _path__namespace.extname(path);
            if (fileInfo.isFile() && ext === '.vue') {
                result.push(path);
            }
            else if (fileInfo.isDirectory()) {
                result = [...result, ...getAllFilesFromDir(path)];
            }
        });
        return result;
    }
    else {
        return [];
    }
}
function makeName(path) {
    let value;
    const withoutRoot = path.replace(componentsDir, '');
    const parsePath = _path__namespace.parse(withoutRoot);
    const nameFromDir = parsePath.dir
        .split('/')
        .map(capitalizeFirstLetter)
        .join('');
    if (parsePath.name.toLowerCase() === 'index') {
        value = nameFromDir;
    }
    else {
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
function makeVue() {
    return `import { createApp } from "vue";

const Vue = createApp({});`;
}
function makeComponentString(name, path) {
    return `Vue.component('${name}', import('${path}'))`;
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function makeDirectives() {
    let result = '';
    directives$.forEach((key) => {
        result += `Vue.directive('${key}', {})`;
    });
    return result;
}

const IMPORT_CONFIG_PATH = '/config/config.json';
const REPLACEMENT_PATH = '@/utils/config.ts';
const REPLACEMENT_STRING = 'import configRef from "@path";\nconst config = configRef.value;\n';
function pseudoConfig (path = IMPORT_CONFIG_PATH, replacePath = REPLACEMENT_PATH) {
    return {
        name: 'transform-config-import',
        transform(code) {
            let result = code;
            const regExp = new RegExp(`import.*${path}.*\\n`, 'ig');
            const matched = code.match(regExp);
            if (matched) {
                matched.forEach((string) => {
                    result = result.replace(string, REPLACEMENT_STRING.replace('@path', replacePath));
                });
                return result;
            }
            return null;
        },
    };
}

exports.devRunning = devRunning;
exports.pseudoConfig = pseudoConfig;
exports.viteIdeHelperGenerate = plugin;
