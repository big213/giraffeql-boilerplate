import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("userUserFollowLink", function (table) {
    table.string("id").notNullable().primary();
    table.string("user").notNullable();
    table.string("target").notNullable();
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
    table.dateTime("updated_at").nullable();
    table.string("created_by").notNullable();
    table.unique(["user", "target"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("userUserFollowLink");
}
