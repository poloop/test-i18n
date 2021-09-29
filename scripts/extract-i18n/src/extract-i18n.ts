
import LanguageFilesParser, { defaultParserOptions } from './language-files-parser'

export enum ReportActions {
  MISSINGS = 'missings',
  DUPLICATES = 'duplicates'
}

export function createI18nReport(actions: ReportActions, languageFiles: string | undefined = defaultParserOptions.languageFiles) {
  const parser = new LanguageFilesParser({ languageFiles })
  const data = parser.extract(parser.read(parser.options.languageFiles)) 

  return {
    missingKeys: (!actions || actions === ReportActions.MISSINGS) ? parser.getMissingKeys(data) : [],
    duplicateKeys: (!actions || actions === ReportActions.DUPLICATES) ? parser.getDuplicateKeys(data) : [],
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