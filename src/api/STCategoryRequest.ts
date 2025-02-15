import { STRequest } from "./index";
import { Category } from "../types";
import { SuperTebex } from "../index";

class STCategoryRequest {
  private readonly requestClient: STRequest;
  private readonly main: SuperTebex;

  constructor(main: SuperTebex, requestClient: STRequest) {
    this.main = main;
    this.requestClient = requestClient;
  }

  async getCategories(includePackages: boolean = false) {
    return this.requestClient.request<Category[]>(
      `accounts/${this.main.getApiPublicKey()}/categories${includePackages ? "?includePackages=1" : ""}`,
      "GET",
      "Une erreur est survenue lors de la récupération des catégories",
    );
  }
}

export default STCategoryRequest;
