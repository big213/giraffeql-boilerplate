import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", function (t) {
    t.renameColumn("avatar", "avatar_url");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", function (t) {
    t.renameColumn("avatar_url", "avatar");
  });
}
