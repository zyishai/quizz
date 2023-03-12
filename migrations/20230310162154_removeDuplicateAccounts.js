const Surreal = require("surrealdb.js").default;

exports.tags = ["payment-account"];

exports.migrate = async (client) => {
  const db = new Surreal();
  await db.connect(process.env.DATABASE_URL);
  await db.signin({
    user: process.env.DATABASE_USER,
    pass: process.env.DATABASE_PASSWORD,
  });
  await db.use("test", "test");

  const [students] = await db.query("select * from students");
  if (students.error) {
    throw students.error;
  }

  const accountsToRemove = [];
  for (let student of students.result) {
    const [accounts] = await db.query(
      "select * from paymentAccount where students contains $studentId",
      { studentId: student.id }
    );
    if (accounts.error) {
      throw accounts.error;
    }
    if (accounts.result.length > 1) {
      const [_, toRemove] = accounts.result;
      accountsToRemove.push(...toRemove);
    }
  }

  const [response] = await db.query("delete from $ids", {
    ids: accountsToRemove.map((account) => account.id).join(", "),
  });
  if (response.error) {
    throw response.error;
  }
};

exports.rollback = async (client) => {};
