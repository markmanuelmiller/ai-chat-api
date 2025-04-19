export declare abstract class Entity<T> {
    protected readonly props: T;
    constructor(props: T);
    equals(entity?: Entity<T>): boolean;
}
