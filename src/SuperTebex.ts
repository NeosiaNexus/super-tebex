import {
  STCartRequest,
  STCategoryRequest,
  STGoalRequest,
  STRequest,
} from "./api";

class SuperTebex {
  // Environment variables
  private readonly apiSecretKey: string;
  private readonly apiPublicKey: string;

  // API clients
  private requestClient: STRequest;

  // API entities
  public cart: STCartRequest;
  public category: STCategoryRequest;
  public goal: STGoalRequest;

  constructor(apiSecretKey: string, apiPublicKey: string) {
    this.apiSecretKey = apiSecretKey;
    this.apiPublicKey = apiPublicKey;

    this.requestClient = new STRequest();

    this.cart = new STCartRequest(this, this.requestClient);
    this.category = new STCategoryRequest(this, this.requestClient);
    this.goal = new STGoalRequest(this, this.requestClient);
  }

  getApiSecretKey(): string {
    return this.apiSecretKey;
  }

  getApiPublicKey(): string {
    return this.apiPublicKey;
  }
}

export default SuperTebex;
