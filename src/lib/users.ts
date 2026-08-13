import { uid } from "@/lib/pricing";

export type UserRole = "admin" | "operacional";
export type UserStatus = "ativo" | "inativo";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  operacional: "Operacional",
};

export const emptyUser = (): AppUser => ({
  id: uid(),
  name: "",
  email: "",
  role: "operacional",
  status: "ativo",
});

export const mockUsers: AppUser[] = [
  { id: "u1", name: "Lucas Lima", email: "lucas.lima@costprice.com", role: "admin", status: "ativo" },
  {
    id: "u2",
    name: "Marina Duarte",
    email: "marina.duarte@costprice.com",
    role: "operacional",
    status: "ativo",
  },
  {
    id: "u3",
    name: "Rafael Antunes",
    email: "rafael.antunes@costprice.com",
    role: "operacional",
    status: "inativo",
  },
];
