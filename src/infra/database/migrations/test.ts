import type { Knex } from "knex";

const threadsTableName = "threads";
const checkpointsTableName = "checkpoints";

export async function up(knex: Knex): Promise<void> {
  // Create the 'threads' table
  await knex.schema.createTable(threadsTableName, (table) => {
    // Primary Key: Unique identifier for the thread
    // Uses gen_random_uuid() for database-level generation
    table.uuid("thread_id").primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Timestamps: Knex helper for created_at and updated_at
    // Defaults to timestamptz and sets default now() and update trigger
    table.timestamps(true, true);
  });

  // Create the 'checkpoints' table
  await knex.schema.createTable(checkpointsTableName, (table) => {
    // Primary Key: Unique identifier for the checkpoint
    table.uuid("checkpoint_id").primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Foreign Key: Link to the parent thread
    // Indexed for efficient lookup of thread history
    // CASCADE delete ensures checkpoints are removed if the thread is deleted
    table
      .uuid("thread_id")
      .notNullable()
      .references("thread_id")
      .inTable(threadsTableName)
      .onDelete("CASCADE")
      .index(); // Crucial for performance!
    
    // Checkpoint Data: Stores the serialized graph state
    // JSONB is efficient and flexible for complex, evolving state
    table.jsonb("checkpoint_data").notNullable();
    
    // Foreign Key: Link to the previous checkpoint in the same thread
    // Nullable because the first checkpoint has no parent
    // SET NULL on delete preserves history if a middle checkpoint is somehow deleted
    table
      .uuid("parent_checkpoint_id")
      .nullable()
      .references("checkpoint_id")
      .inTable(checkpointsTableName)
      .onDelete("SET NULL");
    
    // Timestamp: Records when this specific checkpoint was saved
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of creation due to foreign key constraints
  await knex.schema.dropTableIfExists(checkpointsTableName);
  await knex.schema.dropTableIfExists(threadsTableName);
}