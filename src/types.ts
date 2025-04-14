export interface ProcessedResult {
  id: string;
  cpf: string;
  nome?: string;
  telefone?: string;
  status: 'com_saldo' | 'sem_saldo' | 'erro' | 'pendente' | 'processing' | 'paused';
  valorLiberado?: number;
  banco?: string;
  mensagem?: string;
  log?: string;
  apiResponse?: any;
}

export interface ResultsSummary {
  total: number;
  comSaldo: number;
  semSaldo: number;
  erros: number;
  pendentes: number;
  detalhes: ProcessedResult[];
}

export interface BatchItem {
  id: number;
  batch_id: string;
  type_consultation: string;
  created_at: string;
  file_name: string;
  total_records: number;
  processed_records: number;
  status: string;
}

export interface FiltrosState {
  status: 'todos' | 'pendente' | 'enviado' | 'erro' | 'cancelado';
  banco: string;
  valorMinimo: number;
  busca: string;
}
