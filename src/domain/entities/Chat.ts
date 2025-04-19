import { Entity } from '@/domain/common/Entity';
import { v4 as uuidv4 } from 'uuid';

export interface ChatProps {
  id?: string;
  userId: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Chat extends Entity<ChatProps> {
  get id(): string {
    return this.props.id!;
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  private constructor(props: ChatProps) {
    super(props);
  }

  public static create(props: ChatProps): Chat {
    const defaultProps: ChatProps = {
      ...props,
      id: props.id ?? uuidv4(),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };

    return new Chat(defaultProps);
  }

  public updateTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }
}
