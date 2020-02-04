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

  onmess({ data }) {
    data = JSON.parse(data);
    let lastSent = this.messages.shift();
    console.log(lastSent);
    if (data.code === 0) {
      lastSent.resolve(data.data);
    } else {
      let error = new [...this.config.errors, SyntaxError, TypeError, ReferenceError, RangeError, URIError, EvalError, Error][data.code + 1]();
      error.message = data.data.message;
      error.code = data.data.code;
      lastSent.reject(error);
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
    })
  }
}