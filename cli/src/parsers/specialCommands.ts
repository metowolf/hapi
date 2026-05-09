/**
 * Parsers for special commands that require dedicated remote session handling
 */

export interface CompactCommandResult {
    isCompact: boolean;
    originalMessage: string;
}

export interface ClearCommandResult {
    isClear: boolean;
}

export interface PlanCommandResult {
    isPlan: boolean;
    mode: 'plan' | 'default';
    prompt?: string;
}

export interface ModelCommandResult {
    isModel: boolean;
    model: string | null;
}

export interface SpecialCommandResult {
    type: 'compact' | 'clear' | 'plan' | 'model' | null;
    originalMessage?: string;
    mode?: 'plan' | 'default';
    prompt?: string;
    model?: string | null;
}

/**
 * Parse /compact command
 * Matches messages starting with "/compact " or exactly "/compact"
 */
export function parseCompact(message: string): CompactCommandResult {
    const trimmed = message.trim();
    
    if (trimmed === '/compact') {
        return {
            isCompact: true,
            originalMessage: trimmed
        };
    }
    
    if (trimmed.startsWith('/compact ')) {
        return {
            isCompact: true,
            originalMessage: trimmed
        };
    }
    
    return {
        isCompact: false,
        originalMessage: message
    };
}

/**
 * Parse /clear command
 * Only matches exactly "/clear"
 */
export function parseClear(message: string): ClearCommandResult {
    const trimmed = message.trim();
    
    return {
        isClear: trimmed === '/clear'
    };
}

function stripMatchingQuotes(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
        return trimmed;
    }

    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
        return trimmed.slice(1, -1).trim();
    }

    return trimmed;
}

/**
 * Parse /plan command for remote Claude sessions.
 * - /plan: switch to Claude plan permission mode.
 * - /plan off: switch back to default mode.
 * - /plan <prompt>: switch to plan mode and send the remaining prompt.
 */
export function parsePlan(message: string): PlanCommandResult {
    const trimmed = message.trim();
    const match = /^\/plan(?:\s+([\s\S]*))?$/i.exec(trimmed);
    if (!match) {
        return {
            isPlan: false,
            mode: 'plan'
        };
    }

    const rawArg = match[1]?.trim() ?? '';
    if (rawArg.toLowerCase() === 'off') {
        return {
            isPlan: true,
            mode: 'default'
        };
    }

    return {
        isPlan: true,
        mode: 'plan',
        prompt: rawArg ? stripMatchingQuotes(rawArg) : undefined
    };
}

/**
 * Parse /model command
 * - /model: show current model
 * - /model <name>: set model to <name>
 * - /model auto: reset to default model
 */
export function parseModel(message: string): ModelCommandResult {
    const trimmed = message.trim();
    const match = /^\/model(?:\s+(\S+))?$/i.exec(trimmed);
    if (!match) {
        return { isModel: false, model: null };
    }
    const arg = match[1]?.trim() ?? null;
    return { isModel: true, model: arg };
}

/**
 * Unified parser for special commands
 * Returns the type of command and original message if applicable
 */
export function parseSpecialCommand(message: string): SpecialCommandResult {
    const compactResult = parseCompact(message);
    if (compactResult.isCompact) {
        return {
            type: 'compact',
            originalMessage: compactResult.originalMessage
        };
    }

    const clearResult = parseClear(message);
    if (clearResult.isClear) {
        return {
            type: 'clear'
        };
    }

    const planResult = parsePlan(message);
    if (planResult.isPlan) {
        return {
            type: 'plan',
            mode: planResult.mode,
            prompt: planResult.prompt,
            originalMessage: message.trim()
        };
    }

    const modelResult = parseModel(message);
    if (modelResult.isModel) {
        return {
            type: 'model',
            model: modelResult.model
        };
    }

    return {
        type: null
    };
}
