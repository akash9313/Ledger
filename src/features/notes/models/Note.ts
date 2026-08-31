export interface Note {
  id: string;
  title: string;
  phoneNumber?: string;
  content: string;
  total?: number;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
  deletedAt?: number | null;
}
