import { provideEditingConfig } from 'scrivito'
import { DataIconConditionWidget } from './DataIconConditionWidgetClass'

provideEditingConfig(DataIconConditionWidget, {
  title: 'Data Icon Condition',
  attributes: {
    attributeValue: { title: 'Attribute value' },
    humanReadableValue: { title: 'Human readable value' },
    icon: {
      title: 'Icon',
      description:
        'Default: "bi-box". The full list of names can be found at https://icons.getbootstrap.com/',
    },
  },
  titleForContent: (content) =>
    `${content.get('attributeValue')} => ${content.get('icon')}`,
  properties: ['attributeValue', 'humanReadableValue', 'icon'],
  initialContent: {
    icon: 'bi-box',
  },
})
