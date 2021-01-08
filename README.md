# log-server

Reads from /var/log and exposes an API for retrieving log entries.

Get up and running
```sh
npm install
npm start
```

The server will look for a provided file in the given `LOG_DIRECTORY` based on the path provided.  e.g. requesting `/logfile.log` will return results from `/var/log/logfile.log` with the default configuration.

It also supports to ability to request a specific number of lines from the log and to filter lines on text through the `n` and `filter` query parameters, respectively.

The following environment variables are available to customize the behavior of the server:

| Variable        | Description                                                | Default Value |
| --------------- | ---------------------------------------------------------- | ------------- |
| `PORT`          | The port to listen on                                      | 80            |
| `LOG_DIRECTORY` | The directory to search for log files                      | `/var/log`    |
| `BUFFER_SIZE`   | The maximum amount to read in from a file at once in bytes | 10 KB         |

