import express from 'express';
import bodyParser from 'body-parser'
const app = express();
const port = 8080;

const jsonParser = bodyParser.json();

app.get('/', (req, res) => {
  res.send('Hello World!')
  console.log('there was a get')
})

app.post('/', jsonParser, (req, res) => {
  res.send('got it');
  console.log('req.body: ', req.body);
  // console.log('req ', req)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})