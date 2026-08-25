/**
 * ConnectorManifest — the contract binding the marketplace registry,
 * the visual config editor, and the child-process spawner together.
 */

export type ConnectorCategory =
  | 'developer-tools'
  | 'communication'
  | 'productivity'
  | 'database'
  | 'finance'
  | 'design'
  | 'cloud'
  | 'ai'
  | 'files'
  | 'other';

export interface ConfigFieldUi {
  widget?: 'text' | 'password' | 'textarea' | 'select';
  placeholder?: string;
  helpUrl?: string;
}

/** Minimal JSON Schema (draft-07 subset) used for config forms. */
export interface ConfigFieldSchema {
  type: 'string' | 'number' | 'integer' | 'boolean';
  title?: string;
  description?: string;
  default?: string | number | boolean;
  enum?: string[];
  ui?: ConfigFieldUi;
}

export interface ConnectorManifest {
  /** Stable unique id, kebab-case; also used as default instance slug. */
  id: string;
  name: string;
  /** lucide-react icon name. */
  icon: string;
  description: string;
  category: ConnectorCategory;
  docsUrl: string;
  official?: boolean;
  keywords?: string[];
  /**
   * Exact argv to spawn. "{env.NAME}" placeholders are substituted from the
   * decrypted user config before launch.
   */
  command: {
    run: string[];
    env: Record<string, string>;
  };
  /**
   * JSON Schema for user-supplied config; each property becomes a field
   * in the install/configure form.
   */
  configSchema: {
    type: 'object';
    properties: Record<string, ConfigFieldSchema>;
    required?: string[];
  };
}
