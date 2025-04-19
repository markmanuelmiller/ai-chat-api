import { Entity } from '@/domain/common/Entity';
export interface UserProps {
    id?: string;
    email: string;
    password: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class User extends Entity<UserProps> {
    get id(): string;
    get email(): string;
    get password(): string;
    get name(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    private constructor();
    static create(props: UserProps): User;
}
