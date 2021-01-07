const express = require('express')
const LogManager = require('./services/log-manager')
const app = express()

const PORT = process.env.PORT || 80
const LOG_DIRECTORY = process.env.LOG_DIRECTORY || '/var/log'

const logManager = new LogManager(LOG_DIRECTORY)

app.use(express.json())
app.get('/', (req, res) => {
  logManager.openFile('install.log')
    .then(logFile => {
      logFile.readAll().pipe(res)
    },
    error => console.error(error))
})

app.listen(PORT)
