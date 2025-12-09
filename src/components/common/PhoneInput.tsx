import { useEffect, useMemo, useState } from "react";

type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

const COUNTRIES: Country[] = [
  { code: "UA", name: "Україна", dialCode: "+380", flag: "🇺🇦" },
  { code: "BG", name: "България", dialCode: "+359", flag: "🇧🇬" },
  { code: "RO", name: "România", dialCode: "+40", flag: "🇷🇴" },
  { code: "MD", name: "Republica Moldova", dialCode: "+373", flag: "🇲🇩" },
  { code: "DE", name: "Deutschland", dialCode: "+49", flag: "🇩🇪" },
  { code: "AM", name: "Հայաստան", dialCode: "+374", flag: "🇦🇲" },
  { code: "AT", name: "Österreich", dialCode: "+43", flag: "🇦🇹" },
  { code: "AZ", name: "Azərbaycan", dialCode: "+994", flag: "🇦🇿" },
  { code: "BY", name: "Беларусь", dialCode: "+375", flag: "🇧🇾" },
  { code: "CH", name: "Schweiz", dialCode: "+41", flag: "🇨🇭" },
  { code: "CZ", name: "Česko", dialCode: "+420", flag: "🇨🇿" },
  { code: "EE", name: "Eesti", dialCode: "+372", flag: "🇪🇪" },
  { code: "ES", name: "España", dialCode: "+34", flag: "🇪🇸" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "GE", name: "საქართველო", dialCode: "+995", flag: "🇬🇪" },
  { code: "GR", name: "Ελλάδα", dialCode: "+30", flag: "🇬🇷" },
  { code: "HU", name: "Magyarország", dialCode: "+36", flag: "🇭🇺" },
  { code: "IT", name: "Italia", dialCode: "+39", flag: "🇮🇹" },
  { code: "KZ", name: "Қазақстан", dialCode: "+7", flag: "🇰🇿" },
  { code: "LT", name: "Lietuva", dialCode: "+370", flag: "🇱🇹" },
  { code: "LV", name: "Latvija", dialCode: "+371", flag: "🇱🇻" },
  { code: "PL", name: "Polska", dialCode: "+48", flag: "🇵🇱" },
  { code: "RU", name: "Россия", dialCode: "+7", flag: "🇷🇺" },
  { code: "SE", name: "Sverige", dialCode: "+46", flag: "🇸🇪" },
  { code: "TR", name: "Türkiye", dialCode: "+90", flag: "🇹🇷" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
];

const PINNED_ORDER = ["UA", "BG", "RO", "MD", "DE"];

const normalizeLocalNumber = (value: string) =>
  value.replace(/[^\d\s-]/g, "").replace(/\s+/g, " ");

const extractDigits = (value: string) => value.replace(/\D/g, "");

const formatLocalNumber = (value: string) => {
  const digits = extractDigits(value).slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`.trim();
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`.trim();
};

const normalizeDialCode = (value: string) => {
  const digitsOnly = value.replace(/[\s]/g, "").replace(/(?!^)\+/g, "");
  if (!digitsOnly) return "+";
  return digitsOnly.startsWith("+") ? digitsOnly : `+${digitsOnly.replace(/^\+/, "")}`;
};

const parsePhoneValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { dialCode: "+", local: "" };
  }

  const matchingCountry = COUNTRIES.reduce<Country | null>((best, country) => {
    if (trimmed.startsWith(country.dialCode)) {
      if (!best || country.dialCode.length > best.dialCode.length) return country;
    }
    return best;
  }, null);

  if (matchingCountry) {
    return {
      dialCode: matchingCountry.dialCode,
      local: formatLocalNumber(trimmed.slice(matchingCountry.dialCode.length)),
    };
  }

  const manual = trimmed.match(/^(\+?\d{1,4})(.*)$/);
  if (manual) {
    return {
      dialCode: normalizeDialCode(manual[1]),
      local: formatLocalNumber(manual[2]),
    };
  }

  return { dialCode: "+", local: formatLocalNumber(trimmed) };
};

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export default function PhoneInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  className = "",
}: Props) {
  const parsed = useMemo(() => parsePhoneValue(value), [value]);
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [localNumber, setLocalNumber] = useState(parsed.local);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setDialCode(parsed.dialCode);
    setLocalNumber(formatLocalNumber(parsed.local));
  }, [parsed.dialCode, parsed.local]);

  const orderedCountries = useMemo(() => {
    const pinned = PINNED_ORDER.map((code) => COUNTRIES.find((country) => country.code === code)).filter(
      Boolean,
    ) as Country[];
    const rest = COUNTRIES.filter((country) => !PINNED_ORDER.includes(country.code)).sort((a, b) =>
      a.name.localeCompare(b.name, "ru"),
    );
    return [...pinned, ...rest];
  }, []);

  const emitChange = (nextDial: string, nextLocal: string) => {
    const cleanedDial = normalizeDialCode(nextDial);
    const cleanedLocal = normalizeLocalNumber(formatLocalNumber(nextLocal)).trim();
    const combined = [cleanedDial, cleanedLocal].filter(Boolean).join(" ").trim();
    onChange(combined);
  };

  const handleDialCodeChange = (next: string) => {
    const cleaned = normalizeDialCode(next);
    setDialCode(cleaned);
    emitChange(cleaned, localNumber);
    setIsOpen(true);
  };

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find((item) => item.code === code);
    if (!country) return;
    setDialCode(country.dialCode);
    emitChange(country.dialCode, localNumber);
    setIsOpen(false);
  };

  const handleLocalChange = (nextLocal: string) => {
    const formatted = formatLocalNumber(nextLocal);
    setLocalNumber(formatted);
    emitChange(dialCode, formatted);
  };

  const filteredCountries = useMemo(() => {
    const normalized = normalizeDialCode(dialCode);
    return orderedCountries.filter((country) => country.dialCode.startsWith(normalized));
  }, [dialCode, orderedCountries]);

  return (
    <div
      className={`flex h-12 w-full min-w-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-inner sm:gap-2 ${className}`}
    >
      <div className="relative flex items-center">
        <div className="relative">
          <input
            type="text"
            value={dialCode}
            onChange={(e) => handleDialCodeChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 100)}
            className="w-28 rounded-full bg-slate-50/80 px-3 py-2.5 pr-8 text-base font-semibold text-slate-900 shadow-inner ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500" aria-hidden>
            ▾
          </span>
          {isOpen && (
            <div className="absolute z-10 mt-1 w-full min-w-[10rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="max-h-52 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    type="button"
                    key={country.code}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-base text-slate-900 hover:bg-emerald-50"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleCountryChange(country.code)}
                  >
                    <span className="text-lg" aria-hidden>
                      {country.flag}
                    </span>
                    <span className="font-semibold">{country.code}</span>
                    <span className="text-slate-600">{country.dialCode}</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-3 py-3 text-sm text-slate-500">
                    Ничего не найдено, используется введённый код
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <input
        type="tel"
        id={id}
        required={required}
        value={localNumber}
        onChange={(e) => handleLocalChange(e.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={14}
        className="flex-1 min-w-[12ch] rounded-full bg-slate-50/80 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 shadow-inner ring-1 ring-transparent focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
    </div>
  );
}
