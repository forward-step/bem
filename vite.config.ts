import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import copy from 'rollup-plugin-copy';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: false, // 生成类型文件入口
            copyDtsFiles: true,
        }), // 生成声明文件
        copy({
            targets: [
                {
                    src: './src/scss/*.scss',
                    dest: 'dist/scss',
                },
            ],
            hook: 'writeBundle', // copy的执行时机
        }),
    ],
    // 打包配置
    build: {
        // target: 'esnext',
        outDir: 'dist', // 输出文件夹
        lib: {
            entry: resolve(__dirname, './src/index.ts'), // 入口文件
            name: 'BEM', // 全局变量的名称
            formats: ['es', 'umd'],
            fileName: (format) => `bem.${format}.js`, // 输出文件的名字
        },
        sourcemap: false,
        rollupOptions: {
            // 确保外部化处理那些你不想打包进库的依赖
            external: [],
        },
    },
});
