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

