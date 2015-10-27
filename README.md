# Icecast proxy server for NodeJS (ES2015/ES6 style)

Icecast proxy server that proxies every connection to an existing Icecast (or Shoutcast) server and provides
statistics about every connection and meta-data over a simple HTTP-API.

This proxy can be used to live track listeners and meta-data on mounts that delivers per-user streams over Icecast.  

This script uses ES2015/ES6 together with Babel (https://babeljs.io).

## Installation

You need a installed and recent version of NodeJS and npm. To install all dependencies run:
`npm install`

## Config

There is one simple config file in `config/config.json` that should be pretty self explaining.
It's important that you at least provide a valid Icecast server url.

## Usage

To start this proxy server run:
`npm run start`

If you can listen to an existing stream `http://original-icecast/existing-mount` you can now connect to
`http://localhost:9000/existing-mount` with VLC or simply any modern web browser.

## API

The proxy provides a very simple API at /stats/clients that shows all connected clients with their corresponding meta-data.
