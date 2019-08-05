import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
    input: 'src/actions/index.js',
    output: {
      file: 'src/conversor.js',
      name: 'conversor',
      format: 'umd'
    },
    plugins: [
        resolve(),
        babel(require('./babel.config'))
      ]
};