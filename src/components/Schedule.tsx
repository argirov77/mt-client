"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { API } from "@/config";

type Lang = "ru" | "bg" | "en" | "ua";

type PriceItem = {
  departure_stop_id: number;
  departure_name: string;
  arrival_stop_id: number;
  arrival_name: string;
  price: number;
};

type Dict = {
  schedule: string;
  route: string;
  price: string;
  loading: string;
  error: string;
  noData: string;
};

const translations: Record<Lang, Dict> = {
  ru: {
    schedule: "Цены",
    route: "Маршрут",
    price: "Цена",
    loading: "Загрузка…",
    error: "Ошибка загрузки",
    noData: "Данные не найдены",
  },
  bg: {
    schedule: "Цени",
    route: "Маршрут",
    price: "Цена",
    loading: "Зареждане…",
    error: "Грешка при зареждането",
    noData: "Няма данни",
  },
  en: {
    schedule: "Prices",
    route: "Route",
    price: "Price",
    loading: "Loading…",
    error: "Failed to load",
    noData: "No data",
  },
  ua: {
    schedule: "Ціни",
    route: "Маршрут",
    price: "Ціна",
    loading: "Завантаження…",
    error: "Помилка завантаження",
    noData: "Даних немає",
  },
};

export default function Schedule({ lang = "ru" }: { lang?: Lang }) {
  const t = translations[lang];
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await axios.post(`${API}/selected_pricelist`, { lang });
        setPrices(data?.prices || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, [lang]);

  return (
    <section className="bg-gray-50 py-14" id="prices">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center mb-8">{t.schedule}</h2>
        {loading ? (
          <p className="text-center">{t.loading}</p>
        ) : error ? (
          <p className="text-center text-red-500">{t.error}</p>
        ) : prices.length === 0 ? (
          <p className="text-center">{t.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl text-left">
              <thead>
                <tr>
                  <th className="px-6 py-4">{t.route}</th>
                  <th className="px-6 py-4">{t.price}</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p, i) => (
                  <tr key={`${p.departure_stop_id}-${p.arrival_stop_id}-${i}`}>
                    <td className="px-6 py-4">
                      {p.departure_name.trim()} — {p.arrival_name.trim()}
                    </td>
                    <td className="px-6 py-4">{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
