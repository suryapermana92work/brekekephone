module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: 'react-app',
  // extends: [
  //   'eslint:recommended',
  //   'plugin:@typescript-eslint/eslint-recommended',
  //   'plugin:@typescript-eslint/recommended',
  // ],
  plugins: ['import', 'simple-import-sort'],
  // plugins: ['@typescript-eslint', 'import', 'simple-import-sort'],
  rules: {
    curly: [2, 'all'],
    quotes: [2, 'single'],
    semi: [2, 'never'],
    'sort-imports': 'off',
    'simple-import-sort/sort': 2,
    'import/first': 2,
    'import/newline-after-import': 2,
    'import/no-duplicates': 2,
    'import/no-extraneous-dependencies': 2,
    // '@typescript-eslint/member-delimiter-style': [
    //   2,
    //   {
    //     multiline: {
    //       delimiter: 'none',
    //       requireLast: true,
    //     },
    //     singleline: {
    //       delimiter: 'comma',
    //       requireLast: false,
    //     },
    //   },
    // ],
  },
}
