export interface DomainEvent {
    readonly eventType: string;
    readonly aggregateId: string;
    readonly timestamp: Date;
}
