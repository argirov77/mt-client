type NormalizePassengerContactInput = {
  email: string;
  phone: string;
  passengerNames: string[];
};

type NormalizePassengerContactResult = {
  email: string;
  phone: string;
  passengerNames: string[];
};

const SIMPLE_RFC_COMPATIBLE_EMAIL_REGEX =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i;

export const normalizePassengerContact = ({
  email,
  phone,
  passengerNames,
}: NormalizePassengerContactInput): NormalizePassengerContactResult => ({
  email: email.trim(),
  phone: phone.trim(),
  passengerNames: passengerNames.map((name) => name.trim()),
});

export const isValidPassengerEmail = (value: string): boolean => {
  const email = value.trim();
  if (!email || email.length > 254 || email.includes(" ")) {
    return false;
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart || localPart.length > 64) {
    return false;
  }

  if (!SIMPLE_RFC_COMPATIBLE_EMAIL_REGEX.test(email)) {
    return false;
  }

  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return false;
  }

  const labels = domainPart.split(".");
  if (labels.some((label) => !label || label.length > 63)) {
    return false;
  }

  if (labels.some((label) => label.startsWith("-") || label.endsWith("-"))) {
    return false;
  }

  return true;
};


// Сколько цифр ждём после кода страны. Для остальных кодов — от 6 до 12.
// Болгарские стационарные номера — 8 цифр, мобильные — 9.
const NATIONAL_DIGITS: Record<string, { min: number; max: number }> = {
  "+380": { min: 9, max: 9 },
  "+359": { min: 8, max: 9 },
};

export type PhoneCheck =
  | { ok: true }
  | { ok: false; reason: "empty" | "no_code" | "length"; dialCode: string; expectedDigits: number | null };

/**
 * Проверка телефона в формате PhoneInput: «+380 50 123 4567».
 * Номер без кода страны или с неполным номером на сервер не уходит.
 */
export const checkPassengerPhone = (value: string): PhoneCheck => {
  const trimmed = value.trim();
  const match = /^(\+\d{1,4})\s*(.*)$/.exec(trimmed);
  if (!trimmed || trimmed === "+") {
    return { ok: false, reason: "empty", dialCode: "", expectedDigits: null };
  }
  if (!match) {
    return { ok: false, reason: "no_code", dialCode: "", expectedDigits: null };
  }
  const dialCode = match[1];
  const digits = match[2].replace(/\D/g, "");
  if (!digits) {
    return { ok: false, reason: "empty", dialCode, expectedDigits: NATIONAL_DIGITS[dialCode]?.max ?? null };
  }
  const range = NATIONAL_DIGITS[dialCode] ?? { min: 6, max: 12 };
  if (digits.length < range.min || digits.length > range.max) {
    return { ok: false, reason: "length", dialCode, expectedDigits: NATIONAL_DIGITS[dialCode]?.max ?? null };
  }
  return { ok: true };
};
