/**
 * Client-side secret scrubbing for session transcripts.
 *
 * Agent sessions routinely contain printed `.env` files, `echo $TOKEN` output and
 * pasted credentials. This runs in the browser before the request is sent, so
 * anything it catches never reaches the network at all.
 *
 * It is a safety net, not a guarantee — it catches known key shapes, not secrets
 * that look like ordinary prose. The UI reports what it removed so the user can
 * check the result rather than trust it blindly.
 */

export interface RedactionFinding {
  label: string;
  count: number;
}

export interface RedactionResult {
  text: string;
  findings: RedactionFinding[];
  total: number;
}

interface Rule {
  label: string;
  pattern: RegExp;
  /** Replacement, or a function for rules that must preserve a capture group. */
  replace: string | ((...args: string[]) => string);
}

// Ordered most-specific first so a key isn't matched twice by a broader rule.
const RULES: Rule[] = [
  {
    label: 'Private key blocks',
    pattern: /-----BEGIN[^-]*PRIVATE KEY-----[\s\S]*?-----END[^-]*PRIVATE KEY-----/g,
    replace: '[REDACTED_PRIVATE_KEY]',
  },
  {
    label: 'JWTs',
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    replace: '[REDACTED_JWT]',
  },
  {
    label: 'OpenAI / OpenRouter / Anthropic keys',
    pattern: /\bsk-(?:ant-|or-v\d-|proj-)?[A-Za-z0-9_-]{16,}\b/g,
    replace: '[REDACTED_API_KEY]',
  },
  {
    label: 'GitHub tokens',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{16,}\b/g,
    replace: '[REDACTED_GITHUB_TOKEN]',
  },
  {
    label: 'AWS access keys',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    replace: '[REDACTED_AWS_KEY]',
  },
  {
    label: 'Google API keys',
    pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g,
    replace: '[REDACTED_GOOGLE_KEY]',
  },
  {
    label: 'Slack tokens',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
    replace: '[REDACTED_SLACK_TOKEN]',
  },
  {
    label: 'Stripe keys',
    pattern: /\b[sprk]k_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
    replace: '[REDACTED_STRIPE_KEY]',
  },
  {
    label: 'Bearer tokens',
    pattern: /\b(Bearer\s+)[A-Za-z0-9._~+/-]{20,}=*/g,
    replace: (_m: string, prefix: string) => `${prefix}[REDACTED]`,
  },
  {
    // Runs last: catches `OPENAI_API= sk-...`-style lines whose value shape is
    // unknown. Keeps the variable name so the brief can still mention it.
    label: 'Secret-looking assignments',
    pattern:
      /\b([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|PRIVATE)[A-Z0-9_]*)(\s*[=:]\s*)(?!\[REDACTED)["']?([^\s"'`,;]{8,})["']?/gi,
    replace: (_m: string, name: string, sep: string) => `${name}${sep}[REDACTED]`,
  },
];

export function redactSecrets(input: string): RedactionResult {
  let text = input;
  const findings: RedactionFinding[] = [];

  for (const rule of RULES) {
    let count = 0;
    text = text.replace(rule.pattern, (...args: unknown[]) => {
      count += 1;
      return typeof rule.replace === 'function'
        ? (rule.replace as (...a: string[]) => string)(...(args as string[]))
        : rule.replace;
    });
    if (count > 0) findings.push({ label: rule.label, count });
  }

  return {
    text,
    findings,
    total: findings.reduce((sum, f) => sum + f.count, 0),
  };
}
