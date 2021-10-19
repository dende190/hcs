const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
const { config } = require('../config/config');
const client = new MongoClient(
  config.mongoUri,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

async function send() {
  const today = new Date();
  const date = (
    `${today.getFullYear()}/${(today.getMonth() + 1)}/${today.getDate()}`
  );
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  client.connect(async err => {
    const patients = await (
      client
      .db('patients')
      .collection('emails')
      .find()
      .toArray()
    );

    patients.forEach(patient => {
      if (
        patient.patient.consent.toLowerCase() !== 'y' ||
        !patient.patient.scheduled_dates
      ) {
        return;
      }

      patient.patient.scheduled_dates.forEach(async scheduled => {
        const scheduledDate = new Date(scheduled.scheduled_date);
        const scheduledDateYearMonthDay = (
          `${scheduledDate.getFullYear()}/${(scheduledDate.getMonth() + 1)}/${scheduledDate.getDate()}`
        );

        if (scheduledDateYearMonthDay !== date) {
          return;
        }

        const info = await transporter.sendMail({
          from: '"HCS" <hcs@example.com>',
          to: patient.email,
          subject: 'Scheduled Today !',
          text: `IS TODAY, scheduled name: ${scheduled.name}!`,
          html: '<b>Today today today</b>',
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      });
    });

    client.close();
  });
}

send().catch(console.error);
