import { initNeoletterFormWidgets } from 'my-test-form-widgets'
import { initPisaSalesQuestionnaireWidgets } from 'psa-scr-qst-tst'
import { questionnaireBackendConnection } from '../Data/pisaClient'
import.meta.glob(['./**/*WidgetClass.ts', './**/*WidgetComponent.tsx'], {
  eager: true,
})

initPisaSalesQuestionnaireWidgets({
  connection: questionnaireBackendConnection()
})
initNeoletterFormWidgets({ captchaOptions: { captchaType: "google-recaptcha-v2", siteKey: "6LfpIoYpAAAAANQU2bGh4gANjg-p5JxF11unJ3cd" } })
export { }
