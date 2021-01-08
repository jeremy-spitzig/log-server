const express = require('express')
const LogManager = require('./services/log-manager')
const app = express()

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
      switch(error.message) {
        case 'File must be within log folder.':
        case 'File must be a normal file.':
          res.status(400)
          res.send(error.message)
      }
    })
})

app.listen(PORT)
