const LogManager = require('./log-manager').LogManager
const path = require('path')

const testFilesPath = path.normalize(path.join(__dirname, '../test-files'))
const logManager = new LogManager(testFilesPath, 1024)
const longLineText = 'Very Very Very Very Very Long Line '

test('throw an error if file doesn\'t exist', () => {
  expect.assertions(1)
  return logManager.openFile('non-existent-file.log')
    .catch(error => expect(error.message)
      .toEqual(expect.stringMatching('File not found.')))
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

test('large files are read in full', () => {
  const expected = generateLongFileLines(60)
  expect.assertions(1)
  let contents = ''
  return logManager.openFile('very-large-file.log')
    .then(logFile => logFile.readAll())
    .then(stream => new Promise(resolve=> {
      stream.on('data', (chunk) => contents += chunk)
      stream.on('end', () => resolve(contents))
    }))
    .then(contents => expect(contents).toEqual(expected))
})

test('only the requested number of lines is returned', () => {
  const expected = generateLongFileLines(5)
  expect.assertions(1)
  let contents = ''
  return logManager.openFile('very-large-file.log')
    .then(logFile => logFile.readLines(5))
    .then(stream => new Promise(resolve=> {
      stream.on('data', (chunk) => contents += chunk)
      stream.on('end', () => resolve(contents))
    }))
    .then(contents => expect(contents).toEqual(expected))
})

test('readAll can filter based on keyword', () => {
  const expected = longLineText + '32'
  expect.assertions(1)
  let contents = ''
  return logManager.openFile('very-large-file.log')
    .then(logFile => logFile.readAll('32'))
    .then(stream => new Promise(resolve=> {
      stream.on('data', (chunk) => contents += chunk)
      stream.on('end', () => resolve(contents))
    }))
    .then(contents => expect(contents).toEqual(expected))
})

test('readLines can filter based on keyword', () => {
  const expected = longLineText + '53\n' +
                   longLineText + '43\n' +
                   longLineText + '39\n' +
                   longLineText + '38\n' +
                   longLineText + '37'
  expect.assertions(1)
  let contents = ''
  return logManager.openFile('very-large-file.log')
    .then(logFile => logFile.readLines(5, '3'))
    .then(stream => new Promise(resolve=> {
      stream.on('data', (chunk) => contents += chunk)
      stream.on('end', () => resolve(contents))
    }))
    .then(contents => expect(contents).toEqual(expected))
})


function generateLongFileLines(count) {
  return Array.from(Array(60), (_, index) => longLineText + index)
    .reverse()
    .slice(0, count)
    .join('\n')
}
