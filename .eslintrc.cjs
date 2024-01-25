module.exports = {
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script",
            }
        }
    ],
    "env": {
        "browser": true,
        "es2021": true
    },
    "parserOptions": {
        "ecmaFeatures": {
          "jsx": true
        }
      },
    "parser": "@typescript-eslint/parser",
    "plugins": ["solid"],
    "extends": ["plugin:@typescript-eslint/recommended", "plugin:solid/typescript"],
    "rules": {
        "solid/reactivity": "warn",
        "solid/no-destructure": "warn",
        "solid/jsx-no-undef": "error"
    }
}
