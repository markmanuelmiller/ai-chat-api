import { DomainEvent } from '../DomainEvent';
import { MessageRole } from '@/domain/entities/Message';

export class MessageCreatedEvent implements DomainEvent {
  public readonly eventType = 'message.created';
  public readonly timestamp: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly chatId: string,
    public readonly role: MessageRole,
    public readonly content: string,
  ) {
    this.timestamp = new Date();
  }
}
