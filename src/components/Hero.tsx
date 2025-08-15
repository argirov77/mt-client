import HeroSection from "@/components/hero/HeroSection";

export default function HomePage() {
  const handleSearch = (params: { from: string; to: string; date: string; passengers: number }) => {
    // здесь переход на страницу поиска или прокрутка к расписанию
    console.log(params);
  };
  return (
    <div>
      <HeroSection onSearch={handleSearch} />
      {/* остальные секции */}
    </div>
  );
}
