const LogManager = require('./log-manager')
const path = require('path')

const testFilesPath = path.normalize(path.join(__dirname, '../test-files'))
const logManager = new LogManager(testFilesPath, 1024)

test('throw an error if file doesn\'t exist', () => {
  expect.assertions(1)
  return logManager.openFile('non-existent-file.log')
    .catch(error => expect(error.message)
      .toEqual(expect.stringMatching(/^ENOENT: no such file or directory/)))
})

test('throw an error if file is outside log directory', () => {
  expect.assertions(1)
  return logManager.openFile('../index.js')
    .catch(error => expect(error.message)
      .toEqual('File must be within log folder.'))
})

test('throw an error if file is directory', () => {
  expect.assertions(1)
  return logManager.openFile('directory')
    .catch(error => expect(error.message)
      .toEqual('File must be a normal file.'))
})

test('read entire file in reverse order', () => {
  expect.assertions(1)
  let contents = ''
  return logManager.openFile('good-file.log')
    .then(logFile => logFile.readAll())
    .then(stream => new Promise(resolve=> {
      stream.on('data', (chunk) => contents += chunk)
      stream.on('end', () => resolve(contents))
    }))
    .then(contents => expect(contents).toEqual('line3\nline2\nline1'))
})
