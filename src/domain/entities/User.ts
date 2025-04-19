import { Entity } from '@/domain/common/Entity';
import { v4 as uuidv4 } from 'uuid';

export interface UserProps {
  id?: string;
  email: string;
  password: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Entity<UserProps> {
  get id(): string {
    return this.props.id!;
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  private constructor(props: UserProps) {
    super(props);
  }

  public static create(props: UserProps): User {
    const defaultProps: UserProps = {
      ...props,
      id: props.id ?? uuidv4(),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };

    return new User(defaultProps);
  }
}
