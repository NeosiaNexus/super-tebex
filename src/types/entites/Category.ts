import { Article } from "./index";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  packages: Article[];
  order: number;
  display_type: "grid" | "list";
}

export default Category;
