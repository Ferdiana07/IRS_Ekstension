// ============================================================
// Content: State Machine
// ============================================================

export enum WarState {
  IDLE = 'IDLE',
  READY = 'READY',
  RUNNING = 'RUNNING',
  SCANNING = 'SCANNING',
  COURSE_FOUND = 'COURSE_FOUND',
  SELECTING = 'SELECTING',
  WAITING_FOR_CONFIRMATION = 'WAITING_FOR_CONFIRMATION',
  CONFIRMING = 'CONFIRMING',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  NEXT_TARGET = 'NEXT_TARGET',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED',
}

/** Emoji prefix for each state, used in popup UI */
export const STATE_EMOJI: Record<WarState, string> = {
  [WarState.IDLE]:                     '⚪',
  [WarState.READY]:                    '🟢',
  [WarState.RUNNING]:                  '🔵',
  [WarState.SCANNING]:                 '🔵',
  [WarState.COURSE_FOUND]:             '🟡',
  [WarState.SELECTING]:                '🟡',
  [WarState.WAITING_FOR_CONFIRMATION]: '🟣',
  [WarState.CONFIRMING]:               '🟣',
  [WarState.VERIFYING]:                '🔵',
  [WarState.SUCCESS]:                  '🟢',
  [WarState.NEXT_TARGET]:              '🔵',
  [WarState.COMPLETED]:                '🟢',
  [WarState.FAILED]:                   '🔴',
  [WarState.STOPPED]:                  '⚪',
};

export const STATE_LABEL: Record<WarState, string> = {
  [WarState.IDLE]:                     'IDLE',
  [WarState.READY]:                    'READY',
  [WarState.RUNNING]:                  'RUNNING',
  [WarState.SCANNING]:                 'SCANNING',
  [WarState.COURSE_FOUND]:             'COURSE FOUND',
  [WarState.SELECTING]:                'SELECTING',
  [WarState.WAITING_FOR_CONFIRMATION]: 'WAITING CONFIRMATION',
  [WarState.CONFIRMING]:               'CONFIRMING',
  [WarState.VERIFYING]:                'VERIFYING',
  [WarState.SUCCESS]:                  'SUCCESS',
  [WarState.NEXT_TARGET]:              'NEXT TARGET',
  [WarState.COMPLETED]:                'COMPLETED',
  [WarState.FAILED]:                   'FAILED',
  [WarState.STOPPED]:                  'STOPPED',
};

type StateListener = (state: WarState) => void;

class StateMachine {
  private _state: WarState = WarState.IDLE;
  private _listeners: StateListener[] = [];

  get current(): WarState {
    return this._state;
  }

  transition(to: WarState): void {
    const from = this._state;
    this._state = to;
    this._listeners.forEach((cb) => cb(to));
    // console.debug(`[StateMachine] ${from} → ${to}`);
    void from; // suppress unused
  }

  is(state: WarState): boolean {
    return this._state === state;
  }

  isRunning(): boolean {
    return ![WarState.IDLE, WarState.READY, WarState.COMPLETED, WarState.STOPPED].includes(this._state);
  }

  onChange(cb: StateListener): () => void {
    this._listeners.push(cb);
    return () => { this._listeners = this._listeners.filter((l) => l !== cb); };
  }

  reset(): void {
    this.transition(WarState.IDLE);
  }
}

export const stateMachine = new StateMachine();
