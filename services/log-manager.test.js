const LogManager = require('./log-manager')
const path = require('path')

const testFilesPath = path.normalize(path.join(__dirname, '../test-files'))
const logManager = new LogManager(testFilesPath)

console.log(testFilesPath)

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
