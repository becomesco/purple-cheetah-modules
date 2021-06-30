export interface EmailSenderConfig {
  sender: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  gmail?: {
    auth: {
      type: string;
      user: string;
      clientId: string;
      clientSecret: string;
      refreshToken: string;
    };
  };
}

export interface EmailSender {
  (data: EmailSenderSendData): Promise<void>;
}

export interface EmailSenderSendData {
  to: string;
  subject: string;
  html: string;
}
