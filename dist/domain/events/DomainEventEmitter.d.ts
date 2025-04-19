import { DomainEvent } from './DomainEvent';
export interface EventHandler {
    handle(event: DomainEvent): Promise<void>;
}
export declare class DomainEventEmitter {
    private static instance;
    private handlers;
    private constructor();
    static getInstance(): DomainEventEmitter;
    register(eventType: string, handler: EventHandler): void;
    emit(event: DomainEvent): Promise<void>;
}
