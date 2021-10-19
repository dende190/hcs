const { MongoClient } = require('mongodb');
const csv = require('csvtojson');
const { config } = require('../../config/config');

const tests = {
  csvData: [],
  dataBaseData: [],
  patientsConsentsWithOutEmail: [],
  patientsWithOutFirstName: [],
  patientsWrongEmail: [],
  validateEmail: function(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },
  createJsonToCsv: async function() {
    await (
      csv
      .csv({
        delimiter: 'auto',
      })
      .fromFile(__dirname + '/../../files/data.csv')
      .then(patients => {
        patients.forEach(patient => {
          if (!patient['First Name']) {
            this.patientsWithOutFirstName.push(patient['Member ID']);
          }

          if (
            !patient['Email Address'] &&
            patient['CONSENT'].toLowerCase() === 'y'
          ) {
            this.patientsConsentsWithOutEmail.push(patient['Member ID']);
          }

          if (!patient['Email Address']) {
            return;
          }

          if (!this.validateEmail(patient['Email Address'])) {
            this.patientsWrongEmail.push(patient['Email Address']);
          }

          this.csvData.push({
            'email': patient['Email Address'],
            'patient': {
              'id': patient['Member ID'],
              'name': (patient['First Name'] + ' ' + patient['Last Name']),
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
  matchData: async function() {
    console.log('Verify the data in flat file matches the data in Patients collection');
    const client = new MongoClient(
      config.mongoUri,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );

    client.connect(async err => {
      const patients = await (
        client
        .db('patients')
        .collection('emails')
        .find()
        .toArray()
      );
      client.close();

      const notMatch = patients.find((patient, index) => {
        const patientCsv = this.csvData[index]
        if (
          patientCsv.email !== patient.email ||
          patientCsv.patient.id !== patient.patient.id ||
          patientCsv.patient.name !== patient.patient.name ||
          patientCsv.patient.program_identifier !== patient.patient.program_identifier ||
          patientCsv.patient.data_source !== patient.patient.data_source ||
          patientCsv.patient.card_number !== patient.patient.card_number ||
          patientCsv.patient.date_birth !== patient.patient.date_birth ||
          patientCsv.patient.address_1 !== patient.patient.address_1 ||
          patientCsv.patient.address_2 !== patient.patient.address_2 ||
          patientCsv.patient.city !== patient.patient.city ||
          patientCsv.patient.state !== patient.patient.state ||
          patientCsv.patient.zip_code !== patient.patient.zip_code ||
          patientCsv.patient.telephone_number !== patient.patient.telephone_number ||
          patientCsv.patient.email_address !== patient.patient.email_address ||
          patientCsv.patient.consent !== patient.patient.consent ||
          patientCsv.patient.mobile_phone !== patient.patient.mobile_phone
        ) {
          return true;
        }
      });

      if (notMatch) {
        console.log('database and file not mathces');
      }

      console.log('database and file make match');
    });
  },
  makeTest: async function() {
    await this.createJsonToCsv();
    await this.matchData();
    if (this.patientsWithOutFirstName.length) {
      console.log(
        'the id of the pacients that have no Fisrt Name are: ',
        this.patientsWithOutFirstName.join(', ')
      );
    }

    if (this.patientsConsentsWithOutEmail.length) {
      console.log(
        'the id of the pacients that have no Email and consents is YES are: ',
        this.patientsConsentsWithOutEmail.join(', ')
      );
    }

    if (this.patientsWrongEmail.length) {
      console.log(
        'the email of the pacients that have no Email wrong are: ',
        this.patientsWrongEmail.join(', ')
      );
    }
  }
}

tests.makeTest();
