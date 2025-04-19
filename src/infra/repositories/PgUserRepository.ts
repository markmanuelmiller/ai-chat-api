import { User, UserProps } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { DatabaseService } from '@/infra/database/DatabaseService';

export class PgUserRepository implements UserRepository {
  constructor(private db: DatabaseService) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapToEntity(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapToEntity(result.rows[0]);
  }

  async save(user: User): Promise<User> {
    const { id, email, password, name, createdAt, updatedAt } = user;
    const exists = await this.findById(id);

    if (exists) {
      const result = await this.db.query(
        'UPDATE users SET email = $1, password = $2, name = $3, updated_at = $4 WHERE id = $5 RETURNING *',
        [email, password, name, updatedAt, id],
      );
      return this.mapToEntity(result.rows[0]);
    }

    const result = await this.db.query(
      'INSERT INTO users (id, email, password, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, email, password, name, createdAt, updatedAt],
    );

    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM users WHERE id = $1', [id]);
  }

  private mapToEntity(raw: any): User {
    return User.create({
      id: raw.id,
      email: raw.email,
      password: raw.password,
      name: raw.name,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
