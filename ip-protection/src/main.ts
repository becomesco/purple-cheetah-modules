import type { IPProtection, IPProtectionConfig } from './types';
import type { Module } from '@becomes/purple-cheetah/types';
import { createMiddleware } from '@becomes/purple-cheetah';
import type { NextFunction, Request, Response } from 'express';

const allow: { [ip: string]: boolean } = {};
let allowAvailable = false;
const deny: { [ip: string]: boolean } = {};
let denyAvailable = false;

let ipProtection: IPProtection = {
  add(config) {
    if (config.type === 'allow') {
      allow[config.value] = true;
      allowAvailable = true;
    } else {
      deny[config.value] = true;
      denyAvailable = true;
    }
  },
  remove(config) {
    if (config.type === 'allow') {
      delete allow[config.value];
      if (Object.keys(allow).length === 0) {
        allowAvailable = false;
      }
    } else {
      delete deny[config.value];
      if (Object.keys(deny).length === 0) {
        denyAvailable = false;
      }
    }
  },
  isOnList(config) {
    if (config.type === 'allow') {
      return allow[config.value];
    } else {
      return deny[config.value];
    }
  },
};

export function useIPProtection(): IPProtection {
  return ipProtection;
}

export function createIPProtection(config: IPProtectionConfig): Module {
  if (config.allow) {
    for (let i = 0; i < config.allow.length; i++) {
      allowAvailable = true;
      allow[config.allow[i]] = true;
    }
  }
  if (config.deny) {
    for (let i = 0; i < config.deny.length; i++) {
      denyAvailable = true;
      deny[config.deny[i]] = true;
    }
  }

  return {
    name: 'IP protection',
    initialize(moduleConfig) {
      const middleware = createMiddleware({
        name: 'IP protection middleware',
        after: false,
        handler() {
          return async (
            request: Request,
            response: Response,
            next: NextFunction,
          ) => {
            let ip = request.ip;
            if (config.useTrustedHeader) {
              ip = ('' + request.headers[config.useTrustedHeader]) as string;
            }
            if (deny[ip] || (allowAvailable && !allow[ip])) {
              response.status(403);
              response.end();
              return;
            }
            next();
          };
        },
      });
      moduleConfig.next(undefined, {
        middleware: [middleware],
      });
    },
  };
}
