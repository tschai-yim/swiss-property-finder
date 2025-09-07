## History

This project was originally a client-only React application that is being / was converted into a Next.js. So you might find residue of code that only makes sense on client-only applications.

## Test you changes

When Chrome is available (preferred):

- Start the Next.js server (`yarn dev`) in the background
  - It will only exit if you kill it
  - It will automatically hot-reload changes
  - Pipe it's output to `server.log` so you can read it's output without killing it (for server errors; empty before starting again)
- Open the page on Chrome to test it
  - Once open automatically hot-reloads on changes
  - Sometimes requires reloads when initialization code was changed

When Chrome is not available at least use `yarn build` (which exists automatically) to test compile.
