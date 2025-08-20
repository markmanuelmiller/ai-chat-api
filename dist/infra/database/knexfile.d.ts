declare const _default: {
    client: string;
    connection: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
    pool: {
        min: number;
        max: number;
    };
    migrations: {
        tableName: string;
        directory: string;
        extension: string;
    };
    seeds: {
        directory: string;
        extension: string;
    };
};
export default _default;
