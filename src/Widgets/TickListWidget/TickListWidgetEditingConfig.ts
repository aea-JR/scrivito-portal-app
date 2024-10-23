import thumbnail from './thumbnail.svg'
import { TickListItemWidget } from '../TickListItemWidget/TickListItemWidgetClass'
import { provideEditingConfig } from 'scrivito'
import { ScrivitoBootstrapIconEditor } from 'scrivito-icon-editor'

provideEditingConfig('TickListWidget', {
  title: 'Tick List',
  thumbnail,
  propertiesGroups: [
    {
      title: 'Icon',
      component: ScrivitoBootstrapIconEditor,
      properties: ['icon'],
      key: 'icon-group',
    },
  ],
  initialContent: {
    icon: 'bi-check',
    items: [
      new TickListItemWidget({}),
      new TickListItemWidget({}),
      new TickListItemWidget({}),
    ],
  },
  validations: [
    [
      'items',

      (items) => {
        if (Array.isArray(items) && items.length < 1) {
          return {
            message: 'The tick list must include at least one item.',
            severity: 'error',
          }
        }
      },
    ],
  ],
})
