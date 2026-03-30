
const mongoose = require('mongoose');

async function testQuery() {
  const URI = 'mongodb+srv://connectvarna01_db_user:RcvPh6kjPCgUkQIg@cluster0.e1x9v3h.mongodb.net/test_db';
  await mongoose.connect(URI);

  const TestSchema = new mongoose.Schema({
    tags: [String]
  });

  const TestModel = mongoose.model('TestQuery', TestSchema);

  await TestModel.deleteMany({});
  await TestModel.create({ tags: ['tech', 'design'] });
  await TestModel.create({ tags: ['art'] });

  const tag = 'tech';

  // Method 1: Current logic
  const result1 = await TestModel.find({ tags: { $elemMatch: { $regex: tag, $options: 'i' } } });
  console.log('Result 1 ($elemMatch):', result1.length);

  // Method 2: Standard regex on array
  const result2 = await TestModel.find({ tags: { $regex: tag, $options: 'i' } });
  console.log('Result 2 (regex):', result2.length);

  // Method 3: Equality (if exact)
  const result3 = await TestModel.find({ tags: tag });
  console.log('Result 3 (equality):', result3.length);

  await mongoose.disconnect();
}

testQuery();
