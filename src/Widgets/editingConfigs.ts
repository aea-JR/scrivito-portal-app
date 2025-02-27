import { loadEditingConfigs } from 'scrivito-neoletter-form-widgets/editing'
import { loadQuestionnaireEditingConfigs } from 'psa-scr-qst-tst/editing'

import.meta.glob(['./**/*EditingConfig.ts', './**/*EditingConfig.tsx'], {
  eager: true,
})
loadQuestionnaireEditingConfigs()
loadEditingConfigs()

export {}
