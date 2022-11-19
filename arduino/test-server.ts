import express from 'express';
import bodyParser from 'body-parser'
const app = express();
const port = 6969;

const jsonParser = bodyParser.json();

app.post('/', jsonParser, (req, res) => {
  res.send('got it');
  console.log('req.body: ', req.body);
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})