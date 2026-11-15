import { ThinkingLevel } from '@google/genai';
import { describe, expect, it } from 'vitest';
import {
  AGENT_PROFILES,
  DEFAULT_MAP_ID,
  getChatThinkingConfig,
  getThinkingConfig,
  MODELS,
  resolveMapId,
} from './config';

describe('default Gemini routing', () => {
  it('routes orchestration and task agents to gemini-4-hydrogen with low-latency defaults', () => {
    expect(MODELS.orchestrator).toBe('gemini-4-hydrogen');
    expect(MODELS.chat).toBe(MODELS.orchestrator);
    expect(MODELS.worker).toBe('gemini-4-hydrogen');
    expect(MODELS.utility).toBe(MODELS.worker);
    expect(MODELS.vision).toBe(MODELS.worker);
    expect(MODELS.omni).toBe('gemini-omni-1.2-flash');
    expect(AGENT_PROFILES).toEqual({
      orchestrator: { model: 'gemini-4-hydrogen', thinking: 'low' },
      fastWorker: { model: 'gemini-4-hydrogen', thinking: 'low' },
      analysisWorker: { model: 'gemini-4-hydrogen', thinking: 'low' },
    });
  });

  it('defaults orchestration and evidence analysis to low thinking for responsive UI turnaround', () => {
    expect(getThinkingConfig(MODELS.vision, 'other')).toEqual({
      thinkingLevel: ThinkingLevel.LOW,
    });
    expect(getChatThinkingConfig(MODELS.orchestrator, 'orchestration')).toEqual({
      thinkingLevel: ThinkingLevel.LOW,
    });
  });

  it('uses low thinking for gemini-4-hydrogen simpleUi tasks', () => {
    expect(getThinkingConfig(MODELS.utility, 'simpleUi')).toEqual({
      thinkingLevel: ThinkingLevel.LOW,
    });
  });

  it('allows the orchestrator to be overridden to medium or high, coercing minimal to low on gemini-4', () => {
    expect(getChatThinkingConfig(MODELS.orchestrator, 'orchestration', 'low')).toEqual({
      thinkingLevel: ThinkingLevel.LOW,
    });
    expect(getChatThinkingConfig(MODELS.orchestrator, 'orchestration', 'medium')).toEqual({
      thinkingLevel: ThinkingLevel.MEDIUM,
    });
    expect(getChatThinkingConfig(MODELS.orchestrator, 'orchestration', 'high')).toEqual({
      thinkingLevel: ThinkingLevel.HIGH,
    });
    expect(getChatThinkingConfig(MODELS.orchestrator, 'orchestration', 'minimal')).toEqual({
      thinkingLevel: ThinkingLevel.LOW,
    });
  });
});

describe('Fieldwork Maps configuration', () => {
  it('uses the Google demo map ID when Fieldwork does not provide an override', () => {
    expect(resolveMapId(undefined)).toBe(DEFAULT_MAP_ID);
    expect(resolveMapId('')).toBe(DEFAULT_MAP_ID);
    expect(resolveMapId('custom-map-id')).toBe('custom-map-id');
  });
});
