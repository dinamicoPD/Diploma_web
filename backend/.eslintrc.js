module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // Deshabilitar todas las reglas de TypeScript ya que usamos JS vanilla
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['**/*.js'],
      parser: 'espree', // Usar parser JavaScript estándar
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'script', // CommonJS
      },
      rules: {
        // Deshabilitar todas las reglas problemáticas
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};