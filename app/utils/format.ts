import dayjs from "dayjs"
import { ErrorType } from "~/types/errors"
import { PaymentMethod } from "~/types/payment"
import { AppError } from "./app-error"

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
    case 135: {
      return 'שעתיים ורבע'
    }
    case 150: {
      return 'שעתיים וחצי'
    }
    default: {
      if (duration % 60 === 0) {
        return `${duration / 60} שעות`
      }

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
export const formatGrade = (grade: number) => {
  switch(grade) {
    case 1: {
      return 'כיתה א'
    }
    case 2: {
      return 'כיתה ב'
    }
    case 3: {
      return 'כיתה ג'
    }
    case 4: {
      return 'כיתה ד'
    }
    case 5: {
      return 'כיתה ה'
    }
    case 6: {
      return 'כיתה ו'
    }
    case 7: {
      return 'כיתה ז'
    }
    case 8: {
      return 'כיתה ח'
    }
    case 9: {
      return 'כיתה ט'
    }
    case 10: {
      return 'כיתה י'
    }
    case 11: {
      return 'כיתה יא'
    }
    case 12: {
      return 'כיתה יב'
    }
    default: {
      throw new AppError({ errType: ErrorType.InvalidGrade });
    }
  }
}
export const formatTime24FromMinutes = (minutesSinceMidnight: number) => {
  return `${Math.floor(minutesSinceMidnight / 60)
  .toString()
  .padStart(2, "0")}:${(minutesSinceMidnight % 60)
  .toString()
  .padStart(2, "0")}`
}
