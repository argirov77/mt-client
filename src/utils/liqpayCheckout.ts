type PublicPayResponsePayload = {
  order_id?: unknown;
};

export type PublicPayResponse = {
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

export const normalizePublicPayResponse = (
  payload: PublicPayResponse
): LiqPayCheckoutPayload => {
  const checkoutFormUrlSource = payload.checkout_form_url ?? payload.checkout_url;
  const checkoutFormUrl =
    typeof checkoutFormUrlSource === "string" ? checkoutFormUrlSource.trim() : "";

  if (!checkoutFormUrl) {
    throw new Error("missing checkout_form_url");
  }

  const data = typeof payload.data === "string" ? payload.data : "";
  const signature = typeof payload.signature === "string" ? payload.signature : "";

  if (!data || !signature) {
    throw new Error("missing liqpay checkout fields");
  }

  const payloadOrderId = payload.payload?.order_id;
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
};

