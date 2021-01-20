//process.traceDeprecation = true;

/***********************************************************************
 *
 * WEBPACK CONFIGURATION FILE
 *
 ***********************************************************************/
'use strict';

const sourcePath = './src/';
const outputPath = '/dist';

// PLUGINS
const HtmlWebpackPlugin = require('html-webpack-plugin');               // creates index.html in web/public directory
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');



const postCssLoader = {
    loader: 'postcss-loader',       // adds browser specific prefixes for improved html5 support
    options: {
        postcssOptions: {
            plugins: [
                require('autoprefixer')
            ]
        }
    }
};
const fontFileLoader = {
    loader: 'file-loader',
    options: {
        name: '[name].[ext]',
        outputPath: 'fonts/'    // where the font will go
    }
};
const imgFileLoader = {
    loader: 'file-loader',
    options: {
        name: '[name].[ext]',
        outputPath: 'img/'    // where the img will go
    }
};


const babelLoader = {
    loader: 'babel-loader',
    options: {
        babelrc: false,
        plugins: [
            [
                '@babel/plugin-transform-runtime',
                {
                    'absoluteRuntime': false,
                    'corejs': false,
                    'helpers': false,
                    'regenerator': true,
                    'useESModules': true,
                    'version': "^7.8.4"
                }
            ]
        ],   // solves regenerator runtime errors with dynamic imports
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: '> 1.5%, not dead',
                    modules: false,   // by default, Babel rewrites modules to use CommonJS, which won’t tree-shake!
                },
            ],
            '@babel/preset-flow'
        ],
        cacheDirectory: true,    // speeds up babel compilation (default cache: node_modules/.cache/babel-loader)
    }
};





module.exports = (env, argv) => {
    const isDev = argv.mode !== 'production';

    console.warn(`\n\n\n==========================================`);
    console.log(`Building browser bundle for ${isDev ? 'development' : 'production'}...`);
    console.warn(`==========================================`);

    return {
        entry: [ sourcePath + 'index.js' ],
        output: {
            path: __dirname + outputPath,                               // where to webpack output files
            publicPath: '/',                                            // where browser will request the webpack files
            filename: 'js/[name].js',                     // output filename
            chunkFilename: 'js/chunk_[name].js'           // chunk filename
        },
        mode: isDev ? 'development' : 'production',
        watch: isDev,
        devtool: isDev && 'inline-source-map',
        optimization: {
            minimize: !isDev,
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    extractComments: false,
                    terserOptions: {
                        sourceMap: isDev,
                        ecma: 5,
                        ie8: false,
                        mangle: false,
                    }
                })
            ],
        },
        performance: {
            hints: false    // suppress size limit warnings
        },
        module: {
            rules: [
                // js
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: [ babelLoader ]
                },
                // css
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',       // translates CSS into CommonJS
                        postCssLoader,
                    ],
                },
                // sass
                {
                    test: /\.(sass|scss)$/,
                    exclude: /node_modules/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',       // translates CSS into CommonJS
                        postCssLoader,      // adds browser specific prefixes for improved html5 support
                        'sass-loader',      // compiles Sass into CSS (using Node Sass by default)
                    ]
                },
                // stylus
                {
                    test: /\.styl(us)?$/,   // also detect stylus in .vue files (inside <style lang="stylus"> tag)
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',       // translates CSS into CommonJS
                        postCssLoader,      // adds browser specific prefixes for improved html5 support
                        'stylus-loader',    // compiles stylus into CSS
                    ],
                },
                // font support
                {
                    test: /\.(ttf|otf|eot|woff(2)?)$/,
                    use: [ fontFileLoader ]
                },
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: 'css/index.css',
                chunkFilename: 'css/chunk_[name].css'
            }),
            new HtmlWebpackPlugin({
                template: sourcePath + 'index.html',
                scriptLoading: 'defer',
                filename: 'index.html',
            }),
        ],
    };
}