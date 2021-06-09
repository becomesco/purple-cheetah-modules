export interface GraphqlError {
  status: number;
  message: string;
  stack?: string[];
}
