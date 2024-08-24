import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("file", function (t) {
    t.bigInteger("size").notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("file", function (t) {
    t.integer("size").notNullable().alter();
  });
}
