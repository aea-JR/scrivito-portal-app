import { initNeoletterFormWidgets } from 'scrivito-neoletter-form-widgets'
import { initPisaQuestionnaireWidgets } from 'psa-scr-qst-tst'
import.meta.glob(['./**/*WidgetClass.ts', './**/*WidgetComponent.tsx'], {
  eager: true,
})

initPisaQuestionnaireWidgets({
  pisaUrl: 'https://web130.crm.pisasales.de/api-salesportal',
})
initNeoletterFormWidgets()
export {}
