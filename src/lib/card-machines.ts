export type CardMachineStatus = "ativa" | "inativa";

export interface CardMachine {
  id: string;
  nickname: string; // apelido, ex: "Maquininha Caixa 1"
  model: string; // ex: "Point Mini", "Moderninha X"
  acquirer: string; // adquirente/operadora, ex: "Mercado Pago", "Stone", "PagSeguro"
  serialNumber: string;
  status: CardMachineStatus;
  createdAt: string;
}

export const initialCardMachines: CardMachine[] = [];
