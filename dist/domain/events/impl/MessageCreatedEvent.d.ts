import { DomainEvent } from '../DomainEvent';
import { MessageRole } from '@/domain/entities/Message';
export declare class MessageCreatedEvent implements DomainEvent {
    readonly aggregateId: string;
    readonly chatId: string;
    readonly role: MessageRole;
    readonly content: string;
    readonly eventType = "message.created";
    readonly timestamp: Date;
    constructor(aggregateId: string, chatId: string, role: MessageRole, content: string);
}
