import { provideEditingConfig } from 'scrivito'
import { Order } from './OrderDataClass'

provideEditingConfig(Order, {
  title: 'Order',
  attributes: {
    _id: { title: 'Order ID' },
    keyword: { title: 'Keyword' },
    number: { title: 'Number' },
    type: { title: 'Type' },
    status: { title: 'Status' },
    description: { title: 'Description' },
    totalPrice: { title: 'Total price' },
    termsOfPayment: { title: 'Terms of payment' },
    termsOfDelivery: { title: 'Terms of delivery' },
    customer: { title: 'Customer' },
    commercialAgent: { title: 'Commercial agent (ID)' },
    salesPartner: { title: 'Sales partner' },
    technicalAgent: { title: 'Technical agent (ID)' },
    quoteAt: { title: 'Quote at' },
    orderAt: { title: 'Order at' },
    deliveryAt: { title: 'Delivery at' },
  },
})
