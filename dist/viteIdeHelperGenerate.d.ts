import { Plugin } from 'vite';
interface Options {
    path?: string;
    directives?: string[];
}
declare type PluginInitFunction<T> = ({}: T) => Plugin;
declare const plugin: PluginInitFunction<Options>;
export default plugin;
