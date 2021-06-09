export interface IPProtectionConfig {
  useTrustedHeader?: string;
  allow?: string[];
  deny?: string[];
}

export interface IPProtection {
  add(config: { type: 'allow' | 'deny'; value: string }): void;
  remove(config: { type: 'allow' | 'deny'; value: string }): void;
  isOnList(config: { type: 'allow' | 'deny'; value: string }): boolean;
}
