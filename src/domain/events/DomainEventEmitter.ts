import { DomainEvent } from './DomainEvent';

export interface EventHandler {
  handle(event: DomainEvent): Promise<void>;
}

export class DomainEventEmitter {
  private static instance: DomainEventEmitter;
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  public static getInstance(): DomainEventEmitter {
    if (!DomainEventEmitter.instance) {
      DomainEventEmitter.instance = new DomainEventEmitter();
    }
    return DomainEventEmitter.instance;
  }

  public register(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  public async emit(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    const promises = handlers.map(handler => handler.handle(event));
    await Promise.all(promises);
  }
}
