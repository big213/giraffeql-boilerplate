import { knex } from "../../src/utils/knex";
(async function () {
  // await knex.raw(`ALTER TABLE "salesChannel" ALTER COLUMN type DROP NOT NULL;`);
  // await knex.raw(`ALTER TABLE "salesChannel" ALTER COLUMN type DROP DEFAULT;`);
  // await knex.raw(`ALTER TABLE "ledgerItem" ALTER COLUMN ledger TYPE varchar (10);`);
  /*   await knex.schema.createTable("itinerary", function (table) {
    table.string("id").notNullable().primary();
    table.string("name", 255).notNullable();
    table.string("avatar_url", 255).nullable();
    table.text("description").nullable();
    table.string("itinerary_request").nullable();
    table.string("managed_by").nullable();
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
    table.dateTime("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("created_by").notNullable();
  }); */

  // make the
  /*   await knex.schema.alterTable("order", function (t) {
    t.dropColumn("projection_days");
    t.dropColumn("lookback_days");
    t.dropColumn("incoming_transfer_max_days");
  }); */

  /*   await knex.raw(
    `UPDATE "sale" set timeout_days = 13 WHERE timeout_days IS NULL`
  ); */

  await knex.schema.alterTable("itinerary", function (t) {
    t.renameColumn("departing_city", "departing_airport");
  });

  console.log(`DB Operation completed`);
})();
