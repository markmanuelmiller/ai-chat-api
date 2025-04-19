import { Entity } from '@/domain/common/Entity';
export declare enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system"
}
export interface MessageProps {
    id?: string;
    chatId: string;
    role: MessageRole;
    content: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class Message extends Entity<MessageProps> {
    get id(): string;
    get chatId(): string;
    get role(): MessageRole;
    get content(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    private constructor();
    static create(props: MessageProps): Message;
}
