import HeroSection from "@/components/hero/HeroSection";

export default function HomePage() {
  const handleSearch = (criteria: { from: string; to: string; date: string; seatCount: number }) => {
    // здесь переход на страницу поиска или прокрутка к расписанию
    console.log(criteria);
  };
  return (
    <div>
      <HeroSection onSearch={handleSearch} />
      {/* остальные секции */}
    </div>
  );
}
