import { fetchPaymentAccountsByTeacherId } from "~/adapters/payment.adapter"

export const getPaymentAccountsList = async (teacherId: string) => {
  return fetchPaymentAccountsByTeacherId(teacherId, { fetch: ['students'] });
}
