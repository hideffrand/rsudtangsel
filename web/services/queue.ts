import { api } from './api';

export interface QueueItem {
  number: string;
  name: string;
  status: string;
}

export const queueApi = {
  getByDepartment: (department: string, date?: string) =>
    api.get<QueueItem[]>(
      `/antrian?department=${encodeURIComponent(department)}${date ? `&tanggal=${encodeURIComponent(date)}` : ''}`,
    ),
};
