
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb+srv://darin:BPljDKfbK3EuND8f@mongocluster.kefam.mongodb.net';
const options = { useNewUrlParser: true, useUnifiedTopology: true };
const client = new MongoClient(url, options);

client.connect(function(err, client) {

  if (err) { console.log(err); }
  console.log('Connected successfully to server');

  const db = client.db('coup');
  const collection = db.collection('users');
  const query = {};
  collection.find(query).toArray(function(err, docs) {
    // assert.equal(err, null);
    if (err) { console.log(err); }
    console.log('Found the following records');
    console.log(docs);
    // callback(docs);

    client.close();
  });

});
