const fs = require('fs')
const path = require('path')

const fsp = fs.promises

module.exports = class LogManager {
  constructor(logDirectory, bufferSize) {
    this.logDirectory = logDirectory
    this.bufferSize = bufferSize
  }

  openFile(relativePath) {
    const fullPath = path.join(this.logDirectory, relativePath)
    const relative = path.relative(this.logDirectory, fullPath)
    if(!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      return Promise.reject(new Error('File must be within log folder.'))
    }
    return fsp.access(fullPath, fs.constants.F_OK | fs.constants.R_OK)
      .then(() => fsp.stat(fullPath))
      .then(stat => {
        if(!stat.isFile()) {
          throw new Error('File must be a normal file.')
        }
        return new LogFile(fullPath)
      })
  }
}

class LogFile {
  constructor(filePath, bufferSize) {
    this.bufferSize = bufferSize
    this.filePath = filePath
  }
  readAll() {
    return Promise.resolve(fs.createReadStream(this.filePath))
  }
}
