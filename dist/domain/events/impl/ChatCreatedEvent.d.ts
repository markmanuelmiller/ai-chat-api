import { DomainEvent } from '../DomainEvent';
export declare class ChatCreatedEvent implements DomainEvent {
    readonly aggregateId: string;
    readonly userId: string;
    readonly eventType = "chat.created";
    readonly timestamp: Date;
    constructor(aggregateId: string, userId: string);
}
