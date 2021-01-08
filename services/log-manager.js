const fs = require('fs')
const path = require('path')
const stream = require('stream')

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
        return new LogFile(fullPath, this.bufferSize)
      })
  }
}

class LogFile {
  constructor(filePath, bufferSize) {
    this.bufferSize = bufferSize
    this.filePath = filePath
  }
  readAll() {
    return fsp.stat(this.filePath)
      .then(stat => (new LogFileReader(this.filePath, this.bufferSize, stat.size)
        .readRemainder()))
  }
  readLines(count) {
    return fsp.stat(this.filePath)
      .then(stat => (new LogFileReader(this.filePath, this.bufferSize, stat.size)
        .readLines(count)))
  }
}

class LogFileReader {
  constructor(filePath, bufferSize, fileSize) {
    this.outstanding = ''
    this.filePath = filePath
    this.fileSize = fileSize
    this.bufferSize = bufferSize
    this.position = Math.max(0, fileSize - bufferSize)
    this.end = this.position + bufferSize - 1
  }
  readRemainder() {
    const output = new stream.Readable()
    // after the first chunk, we have to start prepending the missing newline
    let leadingNewline = false
    output._read = () => {
      if(this.hasMore()) {
        this.readChunk().then((chunk) => {
          let data = chunk.join('\n')
          if(leadingNewline) {
            data = '\n' + data
          } else {
            leadingNewline = true
          }
          output.push(data)
        })
      } else {
        output.push(null)
      }
    }
    return output
  }

  readLines(count) {
    let remaining = count
    const output = new stream.Readable()
    // after the first chunk, we have to start prepending the missing newline
    let leadingNewline = false
    output._read = () => {
      if(this.hasMore() && remaining > 0) {
        this.readChunk().then((chunk) => {
          if(chunk.length > remaining) {
            chunk = chunk.slice(0, remaining)
          }
          remaining -= chunk.length
          let data = chunk.join('\n')
          if(leadingNewline) {
            data = '\n' + data
          } else {
            leadingNewline = true
          }
          output.push(data)
        })
      } else {
        output.push(null)
      }
    }
    return output
  }

  readChunk() {
    if(this.position < 0) {
      return Promise.resolve([])
    }
    return new Promise((resolve) => {
      let read = ''
      const stream = fs.createReadStream(this.filePath, {
        start: this.position,
        end: this.end
      })
      stream.on('data', (chunk) => {
        read += chunk
      })
      stream.on('end', () => {
        read += this.outstanding
        const lines = read.split('\n').reverse()
        // If we haven't reached the beginning of the file,
        // the last item read will be incomplete.  Save it for the
        // next chunk
        if(lines.length > 0 && this.position > 0) {
          this.outstanding = lines.pop()
        }
        if(this.position == 0) {
          this.position = -1
          this.end = -1
        } else {
          this.position -= this.bufferSize
          this.end -= this.bufferSize
          if(this.position < 0) {
            this.position = 0
          }
        }
        resolve(lines)
      })
    })
  }

  hasMore() {
    return this.position >= 0
  }
}
