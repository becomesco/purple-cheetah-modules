import type { Module } from '@becomes/purple-cheetah/types';
import { createTransport } from 'nodemailer';
import type {
  EmailSender,
  EmailSenderConfig,
  EmailSenderSendData,
} from './types';

let emailSender: EmailSender;

export function useEmailSender(): EmailSender {
  return emailSender;
}

export function createEmailSender(config: EmailSenderConfig): Module {
  const verified = false;

  if (!config.gmail && !config.smtp) {
    throw Error('Invalid config -> none was found in config: smtp, gmail.');
  }

  const transport = createTransport({
    service: config.gmail ? 'gmail' : undefined,
    host: config.smtp ? config.smtp.host : undefined,
    port: config.smtp ? config.smtp.port : undefined,
    secure: config.smtp ? config.smtp.secure : undefined,
    auth: config.gmail
      ? {
          type: config.gmail.auth.type,
          user: config.gmail.auth.user,
          clientId: config.gmail.auth.clientId,
          clientSecret: config.gmail.auth.clientSecret,
          refreshToken: config.gmail.auth.refreshToken,
        }
      : config.smtp
      ? {}
      : undefined,
  });

  async function send(data: EmailSenderSendData) {}
}
