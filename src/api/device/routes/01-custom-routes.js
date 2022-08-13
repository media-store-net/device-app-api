module.exports = {
  routes: [
    { // Path defined with an URL parameter
      method: 'POST',
      path: '/devices/customer-login',
      handler: 'device.customerLogin',
    },
  ]
}
