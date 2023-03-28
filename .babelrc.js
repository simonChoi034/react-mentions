const {NODE_ENV} = process.env

module.exports = {
    presets: [
        [
            '@babel/env',
            {
                modules: NODE_ENV === 'test' ? 'auto' : false,
            },
        ],
        '@babel/preset-flow',
        '@babel/preset-react',
        '@babel/preset-typescript'
    ],
    comments: true,
    plugins: [
        '@babel/transform-runtime',
        '@babel/plugin-transform-flow-strip-types',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-export-namespace-from',
        '@babel/plugin-proposal-class-properties',
    ],
    include: [
        "./@types/index.d.ts",
        "./src/**/*",
        "./node_modules/@types/**/*"
    ],
}
