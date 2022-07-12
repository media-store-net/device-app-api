module.exports = ({ env }) => ({
    settings: {
      parser: {
        enabled: true,
        multipart: true,
        formidable: {
          maxFileSize: 300 * 1024 * 1024 // Defaults to 200mb
        }
      }
    },
  });