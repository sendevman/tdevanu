const path = require('path');
const cwd = process.cwd();
const distPath = path.resolve(cwd, './dist');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const NanachiWebpackPlugin = require('../../nanachi-loader/plugin');

const buildType = 'wx';

const { REACT_LIB_MAP } = require('../consts');

module.exports = {
    mode: 'development',
    context: cwd,
    entry: './source/app.js',
    output: {
        path: distPath,
        filename: 'index.bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: [
                    require.resolve('../../nanachi-loader/loaders/fileLoader'),
                    require.resolve('../../nanachi-loader')
                    
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(s[ca]ss|less|css)$/,
                use: [
                    require.resolve('../../nanachi-loader/loaders/fileLoader'),
                    require.resolve('../../nanachi-loader/loaders/nanachiStyleLoader'),
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({
            verbose: true,
            cleanOnceBeforeBuildPatterns: ['!assets']
        }),
        new NanachiWebpackPlugin()
    ],
    resolve: {
        alias: {
            'react': path.resolve(cwd, 'source', REACT_LIB_MAP[buildType]),
            '@react': path.resolve(cwd, 'source', REACT_LIB_MAP[buildType]),
            '@components': path.resolve(cwd, 'source/components')
        }
    }
};
