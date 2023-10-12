module.exports = {
  routes: [
    { // Path defined with an URL parameter
      method: 'POST',
      path: '/documents/create-pdf',
      handler: 'document.createPdf',
    },
  ]
}
