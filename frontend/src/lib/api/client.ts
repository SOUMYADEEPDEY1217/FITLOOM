import {
  ApiError,
  ApiResponse,
  ProductsQuery,
  ProductsResponse,
  ProductResponse,
  FitCheckInput,
  FitCheckResponse,
  AvatarDressInput,
  AvatarDressResponse,
} from "./types";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(
  url: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, ...fetchOptions } = options;

  let requestUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    if (query) {
      requestUrl += (url.includes("?") ? "&" : "?") + query;
    }
  }

  const headers = new Headers(customHeaders);
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(requestUrl, {
    method,
    headers,
    credentials: "same-origin",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...fetchOptions,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // Parse JSON response
  let json: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  // If response is the standard FITLOOM envelope: { ok: true, data } | { ok: false, error }
  if (json && typeof json === "object" && "ok" in json) {
    const envelope = json as ApiResponse<T>;
    if (envelope.ok) {
      return envelope.data;
    } else {
      throw new ApiError(
        response.status,
        envelope.error?.code || "REQUEST_FAILED",
        envelope.error?.message || response.statusText || "Request failed",
        envelope.error?.fieldErrors
      );
    }
  }

  // Handle non-standard responses (e.g. Better Auth / third-party endpoints)
  if (!response.ok) {
    let errorCode = "HTTP_ERROR";
    let errorMessage = response.statusText || `Request failed with status ${response.status}`;
    let fieldErrors: Record<string, string> | undefined = undefined;

    if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      if (typeof obj.code === "string") errorCode = obj.code;
      if (typeof obj.message === "string") errorMessage = obj.message;
      else if (typeof obj.error === "string") errorMessage = obj.error;
      else if (typeof obj.error === "object" && obj.error !== null) {
        const errObj = obj.error as Record<string, unknown>;
        if (typeof errObj.message === "string") errorMessage = errObj.message;
        if (typeof errObj.code === "string") errorCode = errObj.code;
      }
      if (typeof obj.fieldErrors === "object" && obj.fieldErrors !== null) {
        fieldErrors = obj.fieldErrors as Record<string, string>;
      }
    }

    throw new ApiError(response.status, errorCode, errorMessage, fieldErrors);
  }

  // Return parsed JSON or fallback
  return (json ?? null) as T;
}

export async function getProducts(
  query?: ProductsQuery
): Promise<ProductsResponse> {
  return api.get<ProductsResponse>("/api/products", {
    params: query as Record<string, string | number | boolean | undefined>,
  });
}

export async function getProduct(id: string): Promise<ProductResponse> {
  return api.get<ProductResponse>(`/api/products/${encodeURIComponent(id)}`);
}

export async function fitCheck(
  body: FitCheckInput
): Promise<FitCheckResponse> {
  return api.post<FitCheckResponse>("/api/fit-check", body);
}

export async function dressAvatar(
  body: AvatarDressInput
): Promise<AvatarDressResponse> {
  return api.post<AvatarDressResponse>("/api/avatar/dress", body);
}

export const api = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, "GET", undefined, options),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, "POST", body, options),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, "PUT", body, options),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, "PATCH", body, options),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, "DELETE", undefined, options),
  getProducts,
  getProduct,
  fitCheck,
  dressAvatar,
};

export default api;
