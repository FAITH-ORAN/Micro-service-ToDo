const express = require('express');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
//const compression = require('compression');

const todosRouter = require('./routes/todos');
const { initDB } = require('./models/todo.model');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

initDB();

// app.use(
//   compression({
//     threshold: 0, // compress every JSON response, no matter how small
//   })
// );
app.use(express.json());

// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { error: 'Too many requests, please try again later.' },
// });
// app.use(limiter);

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});
app.use('/api/todos', todosRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});