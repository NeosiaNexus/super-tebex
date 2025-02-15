import { STRequestMethod, STRequestRoute } from "../types";
import { HEADLESS_BASE_API_URL, PLUGIN_BASE_URL } from "../constants";

class STRequest {
  async request<T>(
    endpoint: string,
    method: STRequestMethod,
    errorMessage?: string,
    body: null | Record<string, unknown> = null,
    headersContent: Record<string, string> = {},
    route: STRequestRoute = "HEADLESS",
  ): Promise<T> {
    const fullUrl = `${this.getRoute(route)}/${endpoint}`;

    const response = await fetch(fullUrl, {
      method,
      headers: new Headers({
        "Content-Type": "application/json",
        ...headersContent,
      }),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        errorMessage ||
          `Une erreur est survenue lors de la requête ${method} vers ${fullUrl}`,
      );
    }

    const responseJson = await response.json();

    return (responseJson.data ?? responseJson) as T;
  }

  private getRoute(route: STRequestRoute) {
    switch (route) {
      case "HEADLESS":
        return HEADLESS_BASE_API_URL;
      case "PLUGIN":
        return PLUGIN_BASE_URL;
      default:
        throw new Error("Route inconnue");
    }
  }
}

export default STRequest;
