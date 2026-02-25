type PublicPayResponsePayload = {
  order_id?: unknown;
};

type PublicPayResponseCheckout = {
  provider?: unknown;
  data?: unknown;
  signature?: unknown;
  payload?: PublicPayResponsePayload | null;
};

export type PublicPayResponse = {
  checkout?: PublicPayResponseCheckout | null;
  checkout_form_url?: unknown;
  checkout_url?: unknown;
  data?: unknown;
  signature?: unknown;
  payload?: PublicPayResponsePayload | null;
};

export type LiqPayCheckoutPayload = {
  checkoutFormUrl: string;
  data: string;
  signature: string;
  orderId: string | null;
};

export const LIQPAY_LAST_ORDER_ID_KEY = "liqpay_last_order_id";
export const LIQPAY_CHECKOUT_ENDPOINT = "https://www.liqpay.ua/api/3/checkout";

export const normalizePublicPayResponse = (
  payload: PublicPayResponse
): LiqPayCheckoutPayload => {
  const checkout = payload.checkout ?? null;

  if (checkout && typeof checkout.provider !== "undefined" && checkout.provider !== "liqpay") {
    const providerLabel =
      typeof checkout.provider === "string" && checkout.provider.trim()
        ? checkout.provider
        : String(checkout.provider);
    throw new Error(`unsupported checkout provider: ${providerLabel}`);
  }

  const checkoutFormUrlSource =
    payload.checkout_form_url ?? payload.checkout_url ?? LIQPAY_CHECKOUT_ENDPOINT;
  const checkoutFormUrl =
    typeof checkoutFormUrlSource === "string" ? checkoutFormUrlSource.trim() : LIQPAY_CHECKOUT_ENDPOINT;

  if (!checkoutFormUrl) {
    throw new Error("missing checkout_form_url");
  }

  const dataSource = checkout?.data ?? payload.data;
  const signatureSource = checkout?.signature ?? payload.signature;
  const data = typeof dataSource === "string" ? dataSource : "";
  const signature = typeof signatureSource === "string" ? signatureSource : "";

  if (!data || !signature) {
    throw new Error("missing liqpay checkout fields");
  }

  const payloadOrderId = checkout?.payload?.order_id ?? payload.payload?.order_id;
  const orderId =
    payloadOrderId === undefined || payloadOrderId === null || payloadOrderId === ""
      ? null
      : String(payloadOrderId);

  return {
    checkoutFormUrl,
    data,
    signature,
    orderId,
  };
};

export const persistLastLiqPayOrderId = (orderId: string | null) => {
  if (typeof window === "undefined" || !orderId) {
    return;
  }

  sessionStorage.setItem(LIQPAY_LAST_ORDER_ID_KEY, orderId);
  localStorage.setItem(LIQPAY_LAST_ORDER_ID_KEY, orderId);
};
