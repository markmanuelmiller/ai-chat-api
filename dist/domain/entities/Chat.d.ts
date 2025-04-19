import { Entity } from '@/domain/common/Entity';
export interface ChatProps {
    id?: string;
    userId: string;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class Chat extends Entity<ChatProps> {
    get id(): string;
    get userId(): string;
    get title(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    private constructor();
    static create(props: ChatProps): Chat;
    updateTitle(title: string): void;
}
