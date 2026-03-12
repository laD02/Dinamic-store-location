import { Store } from "@prisma/client";

export type UIStore = Omit<Store, "createdAt" | "updatedAt"> & {
  type: string;
  createdAt: string;
  updatedAt: string;
};
