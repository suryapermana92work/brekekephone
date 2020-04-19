import Handlebars from 'handlebars/dist/handlebars'
import HandlebarsMoment from 'helper-moment'

Handlebars.registerHelper('moment', HandlebarsMoment)

const intl = (k: string, data?: unknown) => Handlebars.compile(k)(data)
export default (intl as unknown) as (
  template: TemplateStringsArray,
  ...substitutions: any[]
) => string

export interface IntlDebug {
  label: string
  en: string
}

const intlDebug0 = (k: string, data?: unknown) => {
  const r = {} as IntlDebug
  r.label = intl(k, data)
  r.en = r.label
  return r
}
export const intlDebug = (intlDebug0 as unknown) as (
  template: TemplateStringsArray,
  ...substitutions: any[]
) => IntlDebug
