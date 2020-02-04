const WebSocket = require('ws');

module.exports = class Server {
  constructor(port, config, methodsArray) {
    this.port = port;
    this.config = config;
    this.methodsArray = methodsArray;
    this.socket = new WebSocket.Server({ port });
    this.clients = [];

    this.socket.on('connection', this.onConn.bind(this))
  }

  onConn(ws) {
    let clientIndex = this.clients.length;
    this.clients.push(ws);
    ws.on('message', (...args) => this.onData(clientIndex, ...args));
  }

  async onData(clientIndex, data) {
    data = JSON.parse(data);
    for (let i = 0; i < this.methodsArray.length; i += 1) {
      let object = this.methodsArray[i];
      let methodName = this.config.methods[data.type]
      if (typeof object[methodName] === 'function') {
        let success = false;
        let dataToReturn = {};
        try {
          dataToReturn = await object[methodName](clientIndex, ...data.data);
          success = true;
        } catch (error) {
          console.error(error);
          this.sendFunctionError(clientIndex, error);
        }

        if (success) {
          console.log('DATA:', dataToReturn);
          this.send(clientIndex, { code: 0, data: dataToReturn });
        }
      }
    }
  }

  sendFunctionError(client, error) {
    let sent = false;
    [...this.config.errors, SyntaxError, TypeError, ReferenceError, RangeError, URIError, EvalError, Error].forEach((e, i) => {
      if (error instanceof e) {
        sent = true;
        this.send(client, { code: i + 1, data: { code: error.code, message: error.message } });
      }
    });
  }

  send(client, data) {
    this.clients[client].send(JSON.stringify(data));
  }
}