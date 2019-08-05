module.exports = {
  babelrcRoots: ['.', '.src/actions/*'],
  presets: [
    ['@babel/preset-env',{targets: {node: '8.10'}}],
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
}
