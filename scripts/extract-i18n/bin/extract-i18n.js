#!/usr/bin/env node
 /* eslint-disable */

 
 const { program } = require('commander')
 
 const run = () => {
  const term = require( 'terminal-kit' ).terminal
  const { createI18nReport } = require('../dist/extract-i18n')
  console.log('🌐 Extract i18n from your project: ')

  const report = createI18nReport()

  const headerMissingReport = ['LANG', 'FILENAME', 'KEY']

  console.log(report)
  term.table([
      headerMissingReport,
      ...report.missingKeys.map(({lang, fileName, key}) => ([lang, fileName, key]))
    ], {
      hasBorder: true ,
      contentHasMarkup: true ,
      borderChars: 'lightRounded' ,
      borderAttr: { color: 'green' } ,
      textAttr: { bgColor: 'default' } ,
      firstRowTextAttr: { bgColor: 'red' } ,
      fit: true   // Activate all expand/shrink + wordWrap
    }
  )
} 

program
  .version('0.0.1')
  .command('run')
  .action(run)

program.parse(process.argv)
