import { API } from "@/config";

export const buildPublicPurchasePayEndpoint = (purchaseId: string | number): string => {
  return `${API}/public/purchase/${encodeURIComponent(String(purchaseId))}/pay`;
};

