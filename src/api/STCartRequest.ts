import { STRequest } from "./index";
import { Basket } from "../types/entites";
import { SuperTebex } from "../index";

class STCartRequest {
  private readonly requestClient: STRequest;
  private readonly main: SuperTebex;

  constructor(main: SuperTebex, requestClient: STRequest) {
    this.main = main;
    this.requestClient = requestClient;
  }

  async getCart(cartId: string) {
    return this.requestClient.request<Basket>(
      `accounts/${this.main.getApiPublicKey()}/baskets/${cartId}`,
      "GET",
      "Une erreur est survenue lors de la récupération du panier",
    );
  }

  async createCart(username: string) {
    return this.requestClient.request<Basket>(
      `accounts/${this.main.getApiPublicKey()}/baskets`,
      "POST",
      "Une erreur est survenue lors de la création du panier",
      { username },
    );
  }
}

export default STCartRequest;
