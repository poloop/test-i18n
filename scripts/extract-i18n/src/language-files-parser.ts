import path from 'path'
import fs from 'fs'
import glob from 'glob'
import isValidGlob from 'is-valid-glob'
import json5 from 'json5'
import Dot from 'dot-object';

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

const defaultParserOptions: ParserOptions = {
  languageFiles: './locale/**/*.?(json|json5|js|ts)',
  encoding: 'utf8'
}

export default class LanguageFilesParser {
  
  options: ParserOptions
  
  constructor(options: ParserOptions = defaultParserOptions) {
    this.options = {
      ...defaultParserOptions,
      ...options
    }
  }

  read(src: string | undefined):  SimpleFile[] {
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
      const extension: string = fullPath.substring(fullPath.lastIndexOf('.') + 1).toLowerCase()

      let content: I18nStructuredData = {}

      switch(extension) {
        case 'json':
          content = JSON.parse(<string>fs.readFileSync(fullPath, this.options.encoding))
          break;
        case 'json5':
          content = json5.parse(<string>fs.readFileSync(fullPath, this.options.encoding))
          break;
        case 'js':
        case 'ts':
          content = require(f)
          break;
      }

      const fileName = f.replace(process.cwd(), '.')

      return <SimpleFile>{
        fileName,
        path: f,
        content
      }
    })
  }

  extract(languageFiles: SimpleFile[]): I18nStructuredData {
    const localeDir = this.options.languageFiles?.split('**')[0]
    if (!localeDir) {
      throw new Error("languageFiles should be in a separate directory.");
    }
    return languageFiles.reduce((acc: any, file: SimpleFile) => {
      const i18nFileName: string = file.fileName.substring(file.fileName.lastIndexOf('/') + 1, file.fileName.lastIndexOf('.'))

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
        Object.keys((data[lang] as I18nObject)[file]).forEach((key: string) => {
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

  getDuplicateKeys(data: I18nStructuredData): { lang: string, key: string, files: string[]}[] {
    const duplcateKeys: { lang: string, key: string, files: string[]}[] = []
    Object.keys(data).forEach((lang: string) => {
      Object.values(data[lang]).forEach((fileData) => {
        Object.keys(fileData)
      })
    })
    return duplcateKeys
  }
}