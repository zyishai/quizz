import dayjs from "dayjs"
import { PaymentMethod } from "~/types/payment"

export const formatDuration = (duration: number) => {
  switch(duration) {
    case 15: {
      return 'רבע שעה'
    }
    case 30: {
      return 'חצי שעה'
    }
    case 45: {
      return '45 דקות'
    }
    case 60: {
      return 'שעה'
    }
    case 90: {
      return 'שעה וחצי'
    }
    case 120: {
      return 'שעתיים'
    }
    default: {
      return `${duration} דקות`
    }
  }
}
export const formatPaymentMethod = (method?: PaymentMethod) => {
  switch (method) {
    case PaymentMethod.CASH: {
      return 'מזומן'
    }
    case PaymentMethod.CREDIT_CARD: {
      return 'כרטיס אשראי'
    }
    case PaymentMethod.BIT: {
      return 'אפליקציית ביט'
    }
    case PaymentMethod.PAYPAL: {
      return 'פייפאל'
    }
    default: {
      return 'קרדיט';
    }
  }
}
export const formatDateAndTime = (datetime: string | Date) => {
  return dayjs(datetime).format('DD.MM.YYYY, HH:mm');
}
