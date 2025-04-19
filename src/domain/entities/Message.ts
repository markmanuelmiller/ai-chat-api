import { Entity } from '@/domain/common/Entity';
import { v4 as uuidv4 } from 'uuid';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface MessageProps {
  id?: string;
  chatId: string;
  role: MessageRole;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Message extends Entity<MessageProps> {
  get id(): string {
    return this.props.id!;
  }

  get chatId(): string {
    return this.props.chatId;
  }

  get role(): MessageRole {
    return this.props.role;
  }

  get content(): string {
    return this.props.content;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  private constructor(props: MessageProps) {
    super(props);
  }

  public static create(props: MessageProps): Message {
    const defaultProps: MessageProps = {
      ...props,
      id: props.id ?? uuidv4(),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };

    return new Message(defaultProps);
  }
}
