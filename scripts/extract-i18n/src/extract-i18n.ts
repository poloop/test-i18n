
import LanguageFilesParser from './language-files-parser'

export function createI18nReport() {
  const parser = new LanguageFilesParser({
    languageFiles: './locale/**/*.json5'
  })
  const data = parser.read(parser.options.languageFiles)
  console.log('Missing keys', parser.getMissingKeys(parser.extract(data)))

  const missingKeys = parser.getMissingKeys(parser.extract(data))

  return {
    missingKeys,
  }
}

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[extract-i18n]', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('[extract-i18n]', err);
  process.exit(1);
});