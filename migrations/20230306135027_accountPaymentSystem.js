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

  const [students] = await db.query(
    "select id, contacts, <-teach<-teacher as teacherIds from student"
  );
  if (students.error) {
    throw students.error;
  }

  // Remove `paid` and `payments` fields from Lesson entity
  const [lessons] = await db.query(
    "update lesson set paid = undefined, payments = undefined"
  );
  if (lessons.error) {
    throw lessons.error;
  }

  // Create payment account for each student
  for (let student of students.result) {
    const studentId = student.id;
    const contactIds = student.contacts;
    const teacherId = student.teacherIds[0];

    const [existingAccount] = await db.query(
      "select * from paymentAccount where students contains $studentId",
      { studentId: student.id }
    );
    if (existingAccount.error) {
      throw existingAccount.error;
    }

    if (existingAccount.result.length === 0) {
      const [account] = await db.query(
        `create paymentAccount content {
        balance: <future>{ math::sum(payments.sum) - math::sum((select price from lesson where $parent.students contains student)) },
        transactions: <future>{ array::sort::asc(
          array::concat(
            payments,
            (select {type: 'DEBIT', id: id, sum: 0 - price, date: event.dateAndTime} from lesson where $parent.students contains student)
          )
        ) },
        payments: [],
        students: $students,
        contacts: $contacts,
        teacher: $teacherId,
        createdAt: time::now()
      }`,
        { students: [studentId], contacts: contactIds, teacherId }
      );

      if (account.error) {
        throw account.error;
      }
    }
  }
};

// exports.rollback = async (client) => {};
