import { PaymentMethod } from "~/types/payment-account";

export const paymentMethods = [
  { value: PaymentMethod.CASH, label: 'מזומן' },
  { value: PaymentMethod.CREDIT_CARD, label: 'כרטיס אשראי' },
  { value: PaymentMethod.PAYPAL, label: 'פייפאל' },
  { value: PaymentMethod.BIT, label: 'ביט' },
]
