const express = require('express')
const lm = require('./services/log-manager')
const app = express()

const LogManager = lm.LogManager
const constants = lm.constants

const PORT = process.env.PORT || 80
const LOG_DIRECTORY = process.env.LOG_DIRECTORY || '/var/log'
const BUFFER_SIZE = process.env.BUFFER_SIZE || 1024 * 10

const logManager = new LogManager(LOG_DIRECTORY, BUFFER_SIZE)

app.get('/*', (req, res) => {
  const file = req.params[0]
  if(!file) {
    res.status(404)
    res.send('A file must be specified')
    return
  }
  let promise = logManager.openFile(file)
  if(req.query.n != null) {
    const n = parseInt(req.query.n)
    if(n > 0) {
      promise = promise.then(logFile => logFile.readLines(n, req.query.filter))
    } else {
      res.status(400)
      res.send('Bad value for n.  Must be an integer.')
    }
  } else {
    promise = promise.then(logFile => logFile.readAll(req.query.filter))
  }
  promise.then(stream => {
      res.setHeader('Content-Type', 'text/plain')
      stream.pipe(res)
    })
    .catch(error => {
      console.log(error)
      switch(error.message) {
        case constants.errors.ERROR_OUTSIDE_LOG_FOLDER:
        case constants.errors.ERROR_NONNORMAL_FILE:
          res.status(400)
          res.send(error.message)
          break
        case constants.errors.ERROR_FILE_NOT_FOUND:
            res.status(404)
          res.send(error.message)
          break
        default:
          res.status(500)
          res.send('An internal error occurred')
      }
    })
})

app.listen(PORT)
