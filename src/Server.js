const WebSocket = require('ws');

module.exports = class Server {
  constructor(port, config, methodsArray) {
    this.port = port;
    this.config = config;
    this.methodsArray = methodsArray;
    this.socket = new WebSocket({ port });
    this.clients = [];

    this.socket.on('connection', this.onConn.bind(this))
  }

  onConn(ws) {
    let clientIndex = this.clients.length;
    this.clients.push(ws);
    ws.on('data', (...args) => this.onData(clientIndex, ...args));
  }

  async onData(clientIndex, data) {
    let data = JSON.parse(data);
    this.methodsArray.forEach(object => {
      let methodName = this.config.methods[data.type]
      if (typeof object[methodName] === 'function') {
        try {
          let data = await object[methodName](data.data);
          this.send({ type: 0, data })
        } catch (error) {
          this.sendFunctionError(error);
        }
      }
    })
  }

  sendFunctionError(error) {
    let sent = false;
    [...this.config.errors, SyntaxError, TypeError, ReferenceError, RangeError, URIError, EvalError, Error].forEach((e, i) => {
      if (error instanceof e) {
        sent = true;
        this.send({ type: i + 1, data: { code: error.code, message: error.message } });
      }
    });
  }

  send(data) {
    this.socket.send(JSON.stringify(data));
  }
}