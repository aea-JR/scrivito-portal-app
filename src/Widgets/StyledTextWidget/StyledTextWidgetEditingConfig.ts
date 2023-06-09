import * as Scrivito from 'scrivito'
import { StyledTextWidget } from './StyledTextWidgetClass'

Scrivito.provideEditingConfig(StyledTextWidget, {
  title: 'Styled text',
  attributes: {
    alignment: {
      title: 'Alignment',
      description: 'Default: Left',
      values: [
        { value: 'left', title: 'Left' },
        { value: 'center', title: 'Center' },
        { value: 'right', title: 'Right' },
      ],
    },
    opacity: {
      title: 'Opacity',
      description: 'Default: 100%',
      values: [
        { value: 'opacity-100', title: '100%' },
        { value: 'opacity-60', title: '60%' },
        { value: 'opacity-50', title: '50%' },
        { value: 'opacity-40', title: '40%' },
      ],
    },
  },
  properties: ['alignment', 'uppercase', 'bold', 'size', 'opacity'],
  initialContent: {
    alignment: 'left',
    size: 'body-font-size',
    opacity: 'opacity-100',
  },
})