import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user", function (table) {
    table.string("id").notNullable().primary();
    table.string("name", 255).notNullable();
    table.string("firebase_uid", 255).notNullable().unique();
    table.string("email", 255).notNullable().unique();
    table.string("avatar_url", 255).nullable();
    table.text("description").nullable();
    table.integer("role").notNullable().defaultTo(2);
    table.jsonb("permissions").nullable();
    table.boolean("is_public").notNullable().defaultTo(true);
    table.boolean("allow_email_notifications").notNullable().defaultTo(true);
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
    table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
  });
  await knex.schema.createTable("apiKey", function (table) {
    table.string("id").notNullable().primary();
    table.string("name", 255).notNullable();
    table.string("code", 255).notNullable().unique();
    table.string("user").notNullable();
    table.jsonb("permissions").nullable();
    table.boolean("mask_user_role").notNullable();
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
    table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
  });
  await knex.schema.createTable("file", function (table) {
    table.string("id").notNullable().primary();
    table.string("name", 255).notNullable();
    table.bigInteger("size").notNullable();
    table.string("location", 255).notNullable();
    table.string("content_type", 255).notNullable();
    table.string("parent_key", 255).nullable();
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
    table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
  });
  await knex.schema.createTable("userUserFollowLink", function (table) {
    table.string("id").notNullable().primary();
    table.string("user").notNullable();
    table.string("target").notNullable();
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
    table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
    table.unique(["user", "target"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user");
  await knex.schema.dropTable("apiKey");
  await knex.schema.dropTable("file");
  await knex.schema.dropTable("userUserFollowLink");
}
