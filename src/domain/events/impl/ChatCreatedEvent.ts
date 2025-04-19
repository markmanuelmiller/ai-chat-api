import { DomainEvent } from '../DomainEvent';

export class ChatCreatedEvent implements DomainEvent {
  public readonly eventType = 'chat.created';
  public readonly timestamp: Date;

  constructor(public readonly aggregateId: string, public readonly userId: string) {
    this.timestamp = new Date();
  }
}
