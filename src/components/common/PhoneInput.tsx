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
      local: trimmed.slice(matchingCountry.dialCode.length).trimStart(),
    };
  }

  const manual = trimmed.match(/^(\+?\d{1,4})(.*)$/);
  if (manual) {
    return {
      dialCode: normalizeDialCode(manual[1]),
      local: manual[2].trimStart(),
    };
  }

  return { dialCode: "+", local: trimmed };
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

  useEffect(() => {
    setDialCode(parsed.dialCode);
    setLocalNumber(parsed.local);
  }, [parsed.dialCode, parsed.local]);

  const matchedCountry = useMemo(
    () => COUNTRIES.find((country) => dialCode.startsWith(country.dialCode)),
    [dialCode],
  );

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
    const cleanedLocal = normalizeLocalNumber(nextLocal).trim();
    const combined = [cleanedDial, cleanedLocal].filter(Boolean).join(" ").trim();
    onChange(combined);
  };

  const handleDialCodeChange = (next: string) => {
    const cleaned = normalizeDialCode(next);
    setDialCode(cleaned);
    emitChange(cleaned, localNumber);
  };

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find((item) => item.code === code);
    if (!country) return;
    setDialCode(country.dialCode);
    emitChange(country.dialCode, localNumber);
  };

  const handleLocalChange = (nextLocal: string) => {
    setLocalNumber(nextLocal);
    emitChange(dialCode, nextLocal);
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-slate-200 bg-gradient-to-r from-white to-slate-50/80 px-2 py-1 shadow-inner ${className}`}
    >
      <div className="relative flex items-center">
        <select
          className="appearance-none rounded-full bg-white px-3 py-2 pr-8 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          value={matchedCountry?.code ?? "__custom"}
          onChange={(e) => handleCountryChange(e.target.value)}
        >
          {orderedCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.dialCode}
            </option>
          ))}
          <option value="__custom">✏️ {dialCode}</option>
        </select>
        <span className="pointer-events-none absolute right-3 text-[10px] text-slate-500" aria-hidden>
          ▾
        </span>
      </div>
      <div className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
      <input
        type="tel"
        id={id}
        required={required}
        value={localNumber}
        onChange={(e) => handleLocalChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
    </div>
  );
}
