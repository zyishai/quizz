import phone from "phone";

export function formatPhoneNumber(number?: string) {
  if (!number) return null;
  const { isValid, phoneNumber, countryCode } = phone(number, {
    country: "IL",
  });
  if (!isValid) {
    console.warn("Invalid phone number detected:", number);
    return null;
  }

  const phoneNumberComponents = phoneNumber.replace(countryCode, "0").split("");
  phoneNumberComponents.splice(3, 0, "-");
  return phoneNumberComponents;
}
