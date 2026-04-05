module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'google',
    'prettier',
    'eslint-config-prettier',
  ],
  plugins: [
    'prettier',
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
    createDefaultProgram: true,
    project: 'tsconfig.json',
  },
  rules: {
    'no-undef': 'off',
    'prettier/prettier': 'error',
  },
};
