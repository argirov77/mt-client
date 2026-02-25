import { API } from "@/config";

export const buildPublicPurchaseEndpoint = (purchaseId: string | number): string => {
  return `${API}/public/purchase/${encodeURIComponent(String(purchaseId))}`;
};

export const buildPublicPurchasePayEndpoint = (purchaseId: string | number): string => {
  return `${buildPublicPurchaseEndpoint(purchaseId)}/pay`;
};
