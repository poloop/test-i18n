# Extract i18n

Support `.json` and `.json5` locale files. Locales files must be in a folder named with the lang code (en|fr|...).

```bash
[localeDir]
└──[lang]
    └──[*.(json|json5)]
    └──...
```

## Build

```bash
npm run install
npm run build
```

## Run

```bash
npx extract-i18n [commmand] <languageFiles>
```

_`missing-keys` reports all missing keys
_`duplicate-keys` reports all duplicate keys
_`languageFiles`: `"./locale/**/*.json"`
