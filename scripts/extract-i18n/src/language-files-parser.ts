import * as path from 'path'
import * as fs from 'fs'
import glob from 'glob'
import isValidGlob from 'is-valid-glob'
import json5 from 'json5'
import Dot from 'dot-object'

export interface I18nObject {
  [index: string]: string
}

export interface I18nStructuredData {
  [index: string]: string | I18nObject
}

export type ParserOptions = {
  languageFiles?: string,
  encoding?: string
}

type SimpleFile = {
  fileName: string
  path: string
  content: I18nStructuredData
}

export const defaultParserOptions: ParserOptions = {
  languageFiles: './locale/**/*.?(json|json5)'
}

export default class LanguageFilesParser {
  
  options: ParserOptions
  
  constructor(options: ParserOptions = defaultParserOptions) {
    this.options = {
      ...defaultParserOptions,
      ...options
    }
  }

  read(src: string | undefined): SimpleFile[] {
    if (!isValidGlob(src)) {
      throw new Error("languageFiles isn't a valid glob pattern.");
    }

    // eslint-disable-next-line no-console
    console.log(`Read data from "${src}"...`)

    const targetFiles: string[] = glob.sync(src)

    if (targetFiles.length === 0) {
      throw new Error('languageFiles glob has no files.');
    }
  
    return targetFiles.map((f: string) => {
      const fullPath: string = path.resolve(process.cwd(), f)
      const extension: string = path.extname(fullPath).toLowerCase()

      let content: I18nStructuredData = {}
      
      switch (extension) {
        case '.json':
          content = JSON.parse(<string>fs.readFileSync(fullPath, 'utf8'))
          break;
        case '.json5':
          content = json5.parse(<string>fs.readFileSync(fullPath, 'utf8'))
          break;
      }

      return <SimpleFile>{
        fileName: f.replace(process.cwd(), '.'),
        path: f,
        content
      }
    })
  }

  extract(languageFiles: (SimpleFile)[]): I18nStructuredData {
    const localeDir = this.options.languageFiles?.split('**')[0]
    if (!localeDir) {
      throw new Error("languageFiles should be in a separate directory.");
    }
    return languageFiles.reduce((acc: any, file: SimpleFile) => {
      const i18nFileName: string = path.basename(file.fileName)

      const regExp = new RegExp(`(?<=${localeDir})(.*?)(?=/)`)

      const result = file.fileName.match(regExp)

      const lang: string|null = result ? result[0] : null

      if (!lang) {
        throw new Error("languageFiles should be in a language directory named with the language code.");
      }
      const i18nFileContent: I18nStructuredData = file.content

      acc[lang] = {
        ...(acc[lang] ?? {}), 
        [i18nFileName]: Dot.dot(i18nFileContent)
      }

      return acc
    }, {})
  }

  getMissingKeys(data: I18nStructuredData): { lang: string, fileName: string, key: string }[] {
    const missingKeys: { lang: string, fileName: string, key: string }[] = [] 
    Object.keys(data).forEach((lang: string) => {
      Object.keys(data[lang]).forEach((file: string) => {
        Object.keys((data[lang] as I18nStructuredData)[file]).forEach((key: string) => {
          Object.keys(data).filter(lg => lg !== lang).forEach((otherLang: string) => {
            if (!((data[otherLang] as I18nStructuredData)?.[file] as I18nObject)?.[key]) {
              missingKeys.push({
                lang: otherLang,
                fileName: file,
                key
              })
            }
          })
        }) 
      })
    })
    return missingKeys
  }

  getDuplicateKeys(data: I18nStructuredData): { content: string, lang: string, fileNames: string[], keys: string[]}[] {
    const duplicateContents: { content: string, lang: string, file: string, key: string}[] = []
    Object.keys(data).forEach((lang: string) => {
      Object.keys(data[lang]).forEach((file: string) => {
        Object.keys((data[lang] as I18nStructuredData)[file]).forEach((key: string) => {
          duplicateContents.push({ content: ((data[lang] as I18nStructuredData)[file] as I18nObject)[key], lang, key, file})
        })
      })
    })
    const duplicateKeys = duplicateContents.reduce((acc: any, { content, lang, file, key }) => {
      if (duplicateContents.filter(({content: contentToCheck}) => content === contentToCheck).length > 1) {
        acc[content] = {content, lang, fileNames: [...(acc[content]?.fileNames ?? []), file], keys: [...(acc[content]?.keys ?? []), key]}
      }
      return acc
    }, {})
    return Object.values(duplicateKeys)
  }
}