interface Goal {
  id: number;
  created_at: string;
  updated_at: string;
  account: number;
  name: string;
  description: string;
  image: string;
  target: string;
  current: string;
  repeatable: number;
  status: "active" | "undefined";
  sale: number;
}

export default Goal;
