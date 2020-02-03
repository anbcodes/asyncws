module.exports = class Client {
  constructor(path, config) {
    this.path = path;
    this.config = config;
    this.socket = new WebSocket(this.path);
    this.connected = new Promise((resolve, reject) => {
      this.socket.onopen = () => {
        resolve();
      }
    });

    this.socket.onmessage = this.onmess.bind(this)
    this.messages = [];
    this.initMethods();
  }

  onmess(data) {
    data = JSON.parse(data);
    let lastSent = this.messages.shift();
    if (data.code === 0) {
      lastSent.resolve(data.data);
    } else {
      lastSent.reject({type: [...this.config.errors, SyntaxError, TypeError, ReferenceError, RangeError, URIError, EvalError, Error][data.code + 1], ...data});
    }
  }

  initMethods() {
    this.config.methods.forEach((method, i) => {
      this[method] = (...args) => this.send({type: i, data: args});
    });
  }

  connect() {
    return this.connected;
  }

  send(value) {
    return new Promise((resolve, reject) => {
      this.socket.send(JSON.stringify(value));
      this.messages.push({resolve, reject});
    }
  }
}