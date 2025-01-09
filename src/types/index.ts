export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    offerPercentage?: number;
    description?: string;
    colors?: number[];
    sizes?: string[];
    images: string[];
  }
  
  export interface Admin {
    firstName: string;
    lastName: string;
    email: string;
    id: string;
    role: string;
  }