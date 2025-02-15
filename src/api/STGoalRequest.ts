import { STRequest } from "./index";
import { Goal } from "../types";
import { SuperTebex } from "../index";

class STGoalRequest {
  private readonly requestClient: STRequest;
  private readonly main: SuperTebex;

  constructor(main: SuperTebex, requestClient: STRequest) {
    this.main = main;
    this.requestClient = requestClient;
  }

  async getGoals() {
    return this.requestClient.request<Goal[]>(
      "community_goals",
      "GET",
      "Une erreur est survenue lors de la récupération des objectifs",
      null,
      {
        "X-Tebex-Secret": this.main.getApiSecretKey(),
        "Access-Control-Allow-Origin": "*",
      },
      "PLUGIN",
    );
  }
}

export default STGoalRequest;
