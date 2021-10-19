const { MongoClient } = require('mongodb');
const csv = require('csvtojson');
const { config } = require('../config/config');
const today = new Date();
let scheduledDates = [];
for (let day = 1; day <= 4; day++) {
  scheduledDates.push({
    'name': `Day ${day}`,
    'scheduled_date': today.setDate(today.getDate() + 1),
  });
}

const patients = {
  scheduledDates,
  patientsDataMongo: [],
  createJsonToMongo: async function() {
    await (
      csv
      .csv({
        delimiter: 'auto',
      })
      .fromFile(__dirname + '/../files/data.csv')
      .then(patients => {
        patients.forEach(patient => {
          if (!patient['Email Address']) {
            return;
          }

          this.patientsDataMongo.push({
            'email': patient['Email Address'],
            'patient': {
              'id': patient['Member ID'],
              'name': (patient['First Name'] + ' ' + patient['Last Name']),
              'scheduled_dates': (Math.random() > 0.5 ? scheduledDates : []),
              'program_identifier': patient['Program Identifier'],
              'data_source': patient['Data Source'],
              'card_number': patient['Card Number'],
              'date_birth': patient['Date of Birth'],
              'address_1': patient['Address 1'],
              'address_2': patient['Address 2'],
              'city': patient['City'],
              'state': patient['State'],
              'zip_code': patient['Zip code'],
              'telephone_number': patient['Telephone number'],
              'email_address': patient['Email Address'],
              'consent': patient['CONSENT'],
              'mobile_phone': patient['Mobile Phone'],
            }
          });
        });
      })
    );
  },
  create: function() {
    const client = new MongoClient(
      config.mongoUri,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );

    client.connect(async err => {
      if (err) {
        console.error(err);
        return;
      }

      await (
        client
        .db('patients')
        .collection('emails')
        .insertMany(this.patientsDataMongo)
      );
      console.log('patients save successfull !');
      client.close();
    });
  },
  init: async function() {
    await this.createJsonToMongo();
    this.create();
  }
};

patients.init();
