import { ArticleType, CategoryRelation } from "./index";

interface Article {
  id: number;
  name: string;
  description: string;
  image: string | null;
  type: ArticleType;
  category: CategoryRelation;
  basce_price: number;
  sales_tax: number;
  total_price: number;
  currency: string;
  discount: number;
  disable_quantity: boolean;
  disable_gifting: boolean;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
}

export default Article;
