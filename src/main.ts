import { createGame } from './core/Game';

const game = createGame();
// Expose for dev tools / browser automation
(window as unknown as Record<string, unknown>).game = game;
