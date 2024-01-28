import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'antfu/consistent-list-newline': 'off',
    'style/quote-props': 'off',
    'style/indent': 'off',
    'style/brace-style': ['error', '1tbs'],
    'style/arrow-parens': 'off',
    'style/member-delimiter-style': 'off',
    curly: 'off',
  },
})
