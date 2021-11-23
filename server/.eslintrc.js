module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "off",
    "no-console": "off",
    "spaced-comment": "off",
    "no-else-return": "off",
    "consistent-return": "off",
    "import/named": "off",
    "import/no-mutable-exports": "off",
    radix: "off",
    "no-param-reassign": "off",
    "import/prefer-default-export": "off",
    "no-dupe-keys": "off",
    "no-nested-ternary": "off",
    "no-plusplus": "off",
    "no-restricted-syntax": "off",
  },
};
