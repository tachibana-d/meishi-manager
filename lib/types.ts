export interface BusinessCard {
  id: string;
  name: string;
  nameKana: string;
  company: string;
  department: string;
  title: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  website: string;
  photo: string; // base64
  cardImage: string; // base64 of scanned card
  tags: string[];
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export type BusinessCardInput = Omit<BusinessCard, "id" | "createdAt" | "updatedAt">;
