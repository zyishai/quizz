import { Form, Link } from "@remix-run/react";
import { useState } from "react";
import { Credit, PaymentMethod, PaymentStatus } from "~/types/payment";

const payingOptions = [
  { value: PaymentStatus.DEBIT, label: "לא שולם", description: "" },
  {
    value: PaymentStatus.DIRECT,
    label: "תשלום רגיל",
    description: "תשלום חד פעמי עבור השיעור (אשראי, ביט, מזומן וכד׳)",
  },
  {
    value: PaymentStatus.CREDIT,
    label: "תשלום קרדיט",
    description: "עבור שיעורים ששולמו מראש (קרדיט)",
  },
];

const paymentMethods = [
  { value: PaymentMethod.CASH, label: "מזומן" },
  { value: PaymentMethod.CREDIT_CARD, label: "כרטיס אשראי" },
  { value: PaymentMethod.BIT, label: "ביט (Bit)" },
  { value: PaymentMethod.PAYPAL, label: "פייפאל (Paypal)" },
];

type PaymentFormProps = {
  id: string;
  credits: Credit[];
  fields?: PaymentFormFields;
  price: number;
};
type PaymentFormFields = {
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  sum?: number;
  creditId?: string;
};
export default function PaymentForm({
  id,
  fields,
  credits,
  price,
}: PaymentFormProps) {
  const [selectedPayingOption, setSelectedPayingOption] = useState(
    fields?.paymentStatus || PaymentStatus.DEBIT
  );

  return (
    <Form
      id={id}
      method="post"
      replace
      className="grid max-w-[672px] grid-cols-6 gap-6"
    >
      <input type="hidden" name="price" value={price} />

      <div className="col-span-6">
        <label className="text-sm font-semibold text-gray-900">סוג תשלום</label>
        <fieldset className="mt-0">
          <legend className="sr-only">ביצוע תשלום</legend>
          <div className="divide-y divide-gray-200">
            {payingOptions.map((option) => (
              <div className="flex items-center py-4 px-1" key={option.value}>
                <input
                  id={option.value}
                  name="paymentStatus"
                  type="radio"
                  checked={option.value === selectedPayingOption}
                  value={option.value}
                  onChange={(e) => setSelectedPayingOption(option.value)}
                  className="h-4 w-4 border-gray-300 text-amber-500 focus:ring-amber-400"
                />
                <label
                  htmlFor={option.value}
                  className="text-sm ltr:ml-3 rtl:mr-3"
                >
                  <header className="block text-sm font-medium text-gray-800">
                    {option.label}
                  </header>
                  <p className="text-gray-500">{option.description}</p>
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      {selectedPayingOption !== PaymentStatus.DEBIT ? (
        <div className="col-span-6">
          <label className="text-sm font-semibold text-gray-900">
            אופן תשלום
          </label>

          {selectedPayingOption === PaymentStatus.DIRECT ? (
            <>
              <fieldset className="mt-4 px-1">
                <legend className="sr-only">תשלום ישיר</legend>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.value} className="flex items-center">
                      <input
                        id={method.value}
                        name="paymentMethod"
                        value={method.value}
                        type="radio"
                        defaultChecked={
                          method.value ===
                          (fields?.paymentMethod || PaymentMethod.CASH)
                        }
                        className="h-4 w-4 border-gray-300 text-amber-500 focus:ring-amber-400"
                      />
                      <label
                        htmlFor={method.value}
                        className="block text-sm font-medium text-gray-700 ltr:ml-3 rtl:mr-3"
                      >
                        {method.label}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
              <div className="mt-6">
                <label
                  htmlFor="sum"
                  className="block text-sm font-semibold text-gray-700"
                >
                  סכום (בשקלים)
                </label>
                <input
                  type="number"
                  name="sum"
                  id="sum"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 disabled:bg-gray-50 sm:text-sm"
                  defaultValue={fields?.sum || 0}
                />
              </div>
            </>
          ) : selectedPayingOption === PaymentStatus.CREDIT ? (
            <div className="divide-y divide-gray-200">
              {credits.map((credit, index) => (
                <div
                  key={credit.id}
                  className="relative flex items-start py-4 px-1"
                >
                  <div className="flex h-5 items-center ltr:mr-3 rtl:ml-3">
                    <input
                      id={`credit-${credit.id}`}
                      name="creditId"
                      value={credit.id}
                      type="radio"
                      defaultChecked={
                        credit.id === fields?.creditId || index === 0
                      }
                      className="h-4 w-4 border-gray-300 text-amber-500 focus:ring-amber-400"
                    />
                  </div>
                  <label
                    className="min-w-0 flex-1 text-sm"
                    htmlFor={`credit-${credit.id}`}
                  >
                    <div className="font-semibold text-gray-700">
                      קרדיט ע״ס {credit.sum} &#8362;
                    </div>
                    <p className="text-gray-500">
                      נותרו: {credit.remaining} &#8362;
                    </p>
                  </label>
                </div>
              ))}
              {credits.length === 0 && (
                <p className="text-sm text-gray-400">
                  אין קרדיטים עבור תלמיד זה
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </Form>
  );
}
