import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. domain_cache table (Level 2 cache with 24h TTL)
  const hasDomainCache = await knex.schema.hasTable('domain_cache');
  if (!hasDomainCache) {
    await knex.schema.createTable('domain_cache', (table) => {
      table.string('domain').primary();
      table.boolean('has_mx').notNullable();
      table.text('mx_records').notNullable(); // JSON serialized array
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('expires_at').notNullable();
      table.index(['expires_at']);
    });
  }

  // 2. jobs table (asynchronous bulk jobs)
  const hasJobs = await knex.schema.hasTable('jobs');
  if (!hasJobs) {
    await knex.schema.createTable('jobs', (table) => {
      table.string('id').primary();
      table.string('filename').nullable();
      table.string('status', 32).notNullable().defaultTo('pending');
      table.integer('total_emails').notNullable().defaultTo(0);
      table.integer('processed_emails').notNullable().defaultTo(0);
      table.integer('valid_count').notNullable().defaultTo(0);
      table.integer('risky_count').notNullable().defaultTo(0);
      table.integer('invalid_count').notNullable().defaultTo(0);
      table.text('error_message').nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.index(['status']);
    });
  }

  // 3. job_items table
  const hasJobItems = await knex.schema.hasTable('job_items');
  if (!hasJobItems) {
    await knex.schema.createTable('job_items', (table) => {
      table.increments('id').primary();
      table.string('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
      table.string('email').notNullable();
      table.string('status', 32).notNullable().defaultTo('pending');
      table.text('result').nullable(); // JSON serialized VerificationResult
      table.text('error').nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.index(['job_id', 'status']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('job_items');
  await knex.schema.dropTableIfExists('jobs');
  await knex.schema.dropTableIfExists('domain_cache');
}
