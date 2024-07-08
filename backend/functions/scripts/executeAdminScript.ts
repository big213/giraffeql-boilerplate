import "../src/schema";
import {
  Coach,
  CoachTransactionLog,
  UserCourseEnrollmentLink,
} from "../src/schema/services";
import yargs from "yargs";
import { initializeKnex } from "../src/utils/knex";
// import { Admin } from "../schema/services";
import { development, production } from "../knexfile";
import { coachTransactionLogType } from "../src/schema/enums";

const argv = yargs(process.argv.slice(2))
  .options({
    prod: { type: "boolean", default: false },
  })
  .parseSync();

// set the DEV state based on the args provided
if (argv.prod) {
  delete process.env.DEV;
} else {
  process.env.DEV = "1";
}

initializeKnex(argv.prod ? production : development);

console.log(`Executing script on: ${argv.prod ? "production" : "development"}`);

(async () => {
  // delete all coachTxnLogs
  await CoachTransactionLog.deleteSqlRecord({
    where: {},
  });

  // get all enrollments
  const enrollments = await UserCourseEnrollmentLink.getAllSqlRecord({
    select: [
      "id",
      "paymentItem",
      "paymentItem.id",
      "paymentItem.price",
      "paymentItem.quantityRefunded",
      "createdBy.id",
    ],
    where: {},
  });
  console.log(enrollments.filter((e) => e["paymentItem"]).length);
  let balance = 0;
  // generate the coach transaction logs
  for (const enrollment of enrollments) {
    const finalAmount =
      Math.round(100 * 0.3 * enrollment["paymentItem.price"]) / 100;

    if (enrollment["paymentItem.id"]) {
      await CoachTransactionLog.createSqlRecord({
        fields: {
          coach: "myw3j3dm", // tymon
          amount: finalAmount,
          itemId: `userCourseEnrollmentLink_${enrollment.id}`,
          paymentItem: enrollment["paymentItem.id"],
          type: coachTransactionLogType.COURSE_ENROLLMENT.parsed,
          createdBy: enrollment["createdBy.id"],
        },
      });

      // increment the balance by final amount
      balance += finalAmount;
    }

    if (enrollment["paymentItem.quantityRefunded"]) {
      // if quantityRefunded, also create a refund transaction
      await CoachTransactionLog.createSqlRecord({
        fields: {
          coach: "myw3j3dm", // tymon
          amount: -1 * finalAmount,
          itemId: `userCourseEnrollmentLink_${enrollment.id}`,
          paymentItem: enrollment["paymentItem.id"],
          type: coachTransactionLogType.REFUND.parsed,
          createdBy: enrollment["createdBy.id"],
        },
      });

      balance -= finalAmount;
    }
  }
  // update the balance
  await Coach.updateSqlRecord({
    fields: {
      balance,
    },
    where: {
      id: "myw3j3dm",
    },
  });

  console.log("done");
})();
