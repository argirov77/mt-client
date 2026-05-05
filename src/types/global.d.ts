declare function gtag(...args: any[]): void;

interface Window {
  gtag: (...args: any[]) => void;
  dataLayer: any[];
}
