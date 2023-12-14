'use strict';

/**
 * document service
 */

const {createCoreService} = require('@strapi/strapi').factories;

const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const os = require("os");
const i18next = require("i18next");
const i18nBackend = require("i18next-http-backend");

// Pfad zum öffentlichen Verzeichnis
const publicPath = path.resolve(__dirname, '../../../../public');
const en = require(path.join(publicPath, 'locales/en/en.json'));
const de = require(path.join(publicPath, 'locales/de/de.json'));

var fonts = {
  Roboto: {
    normal: path.join(publicPath, '/fonts/Roboto/Roboto-Regular.ttf'),
    bold: path.join(publicPath, '/fonts/Roboto/Roboto-Medium.ttf'),
    italics: path.join(publicPath, '/fonts/Roboto/Roboto-Italic.ttf'),
    bolditalics: path.join(publicPath, '/fonts/Roboto/Roboto-MediumItalic.ttf')
  }
}

i18next.use(i18nBackend).init({
  fallbackLng: 'de',
  resources: {
    de, en
  }
});


module.exports = createCoreService('api::document.document', ({strapi}) => ({

  /**
   *
   * @param sn
   * @param pass
   * @param locale
   * @return {Promise<Utils.Expression.If<Common.AreSchemaRegistriesExtended, GetValues<string, Utils.Guard.Never<ExtractFields<string, {populate: string[]}["fields"]>, Attribute.GetNonPopulatableKeys<string>>, ExtractPopulate<string, string[]>>, AnyEntity>>}
   */
  qrcode: async ({sn, pass, locale}) => {
    const doc = await strapi.db.query('api::document.document').findOne({
      where: {slug: 'qrcode', locale},
      populate: ['header_image.url', 'disclosure_image.url', 'footer_image.url']
    })

    const device = await strapi.db.query('api::device.device').findOne({
      where: {sn}
    })

    const filename = `${i18next.t('qrcode.filename', {lng: locale})}_${device.sn.toUpperCase()}.pdf`;
    // Generate a Link to App-Login and use it in QR Code section
    const appLogin = `https://device-app.powasert.org/customer-login?sn=${device.sn.toUpperCase()}`;
    const printer = new PdfPrinter(fonts);

    try {
      const pdfDoc = printer.createPdfKitDocument({
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: [
          {
            image: path.join(publicPath, doc.header_image.url),
            width: 350,
            alignment: 'center',
            style: 'header'
          },
          {
            text: doc.intro,
            alignment: 'center',
            style: 'text'
          },
          {
            text: appLogin,
            link: appLogin,
            alignment: 'center',
            style: 'text'
          },
          {
            qr: appLogin,
            style: 'qrcode',
            fit: '100',
            alignment: 'center'
          },
          {
            text: `SN: ${device.sn.toUpperCase()} \r\n Passwort: ${pass}`,
            style: 'text'
          },
          {
            text: i18next.t('qrcode.difficult', {lng: locale}),
            style: 'bolderText',
            alignment: 'center'
          },
          {
            image: path.join(publicPath, doc.disclosure_image.url),
            width: 100,
            alignment: 'center',
            style: 'text'
          },
          {
            text: i18next.t('qrcode.panic', {lng: locale}),
            style: 'bolderText',
            alignment: 'center'
          },
          {
            text: doc.content,
            alignment: 'center',
            style: 'text'
          }
        ],
        footer: {
          image: path.join(publicPath, doc.footer_image.url),
          alignment: 'center',
          width: 500,
          style: 'footer'
        },
        styles: {
          header: {
            marginBottom: 20
          },
          text: {
            marginBottom: 10,
            alignment: 'center'
          },
          qrcode: {
            marginTop: 10,
            marginBottom: 10
          },
          bolderText: {
            bold: true,
            marginBottom: 10
          },
          footer: {
            marginBottom: 80
          }
        },
        defaultStyle: {
          fontSize: 12
        }
      })
      pdfDoc.pipe(fs.createWriteStream(path.join(publicPath, 'tmp', filename)));
      const pdfEnd = await pdfDoc.end();

      // on end event upload the file
      return strapi.service('api::document.document')
        .checkFileExist(path.join(publicPath, 'tmp', filename)).then(async () => {
          // prepare the file with meta
          const file = await strapi.service('api::document.document')
            .readAndPrepareFile(path.join(publicPath, 'tmp', filename), filename)

          // upload the file
          const upload = await strapi.service('api::document.document')
            .saveFileToDatabase({data: {}, files: [file]})

          // find the doctype
          const doctype = await strapi.db.query('api::doctype.doctype').findOne(
            {where: {title: 'Dokumentation'}}
          )

          // create media and add to device
          const media = await strapi.entityService.create('api::media.media', {
            data: {
              filename: upload[0].name,
              url: upload[0].id,
              doctype: doctype.id,
              devices: [device.id]
            }
          })

          if (media.id) {
            fs.rmSync(path.join(publicPath, 'tmp', filename))
          }

          return await strapi.entityService.findOne('api::media.media', media.id, {
            populate: ['url']
          })

        })

    } catch (e) {
      console.log(e)
      return e
    }

  },

  /**
   *
   * @param sn
   * @param pass
   * @param locale
   * @return {Promise<Utils.Expression.If<Common.AreSchemaRegistriesExtended, GetValues<string, Utils.Guard.Never<ExtractFields<string, {populate: string[]}["fields"]>, Attribute.GetNonPopulatableKeys<string>>, ExtractPopulate<string, string[]>>, AnyEntity>>}
   */
  confirmity: async ({sn, pass, locale}) => {
    const doc = await strapi.db.query('api::document.document').findOne({
      where: {slug: 'confirmity', locale},
      populate: true
    })

    const device = await strapi.db.query('api::device.device').findOne({
      where: {sn},
      locale,
      populate: true
    })

    const filename = `${i18next.t('confirmity.filename', {lng: locale})} ${device.sn.toUpperCase()}.pdf`;
    // const appLogin = `https://device-api.powasert.de/customer-login?sn=${device.sn.toUpperCase()}`;
    const printer = new PdfPrinter(fonts);

    try {
      const pdfDoc = printer.createPdfKitDocument({
        pageSize: 'A4',
        pageMargins: [40, 100, 40, 60],
        header: {
          image: path.join(publicPath, doc.header_image.url),
          width: 500,
          style: 'header'
        },
        content: [
          {
            text: doc.title,
            style: 'title'
          },
          {
            text: doc.subtitle,
            style: 'text',
            alignment: 'center'
          },
          {
            text: doc.intro,
            style: 'text',
            alignment: 'left'
          },
          {
            columns: [
              {
                text: 'POWASERT',
                alignment: 'left',
                margin: [140, 0, 0, 0]
              },
              {
                text: device.part.desc,
                alignment: 'left'
              }
            ]
          },
          {
            columns: [
              {
                text: 'Typ:',
                alignment: 'left',
                margin: [140, 0, 0, 0]
              },
              {
                text: device.part.title,
                alignment: 'left'
              }
            ]
          },
          {
            columns: [
              {
                text: 'Fabr. Nr.:',
                alignment: 'left',
                margin: [140, 0, 0, 0]
              },
              {
                text: device.sn.toUpperCase(),
                alignment: 'left'
              }
            ]
          },
          {
            text: doc.content,
            style: 'text',
            alignment: 'left',
            margin: [0, 20, 0, 0]
          },
          {
            image: path.join(publicPath, doc.disclosure_image.url),
            alignment: 'left',
            width: 150
          }
        ],
        footer: {
          image: path.join(publicPath, doc.footer_image.url),
          alignment: 'center',
          width: 500,
          style: 'footer'
        },
        styles: {
          header: {
            marginTop: 20,
            alignment: 'center'
          },
          title: {
            marginTop: 60,
            alignment: 'center',
            fontSize: 16,
            bold: true,
            italics: true,
            marginBottom: 15
          },
          text: {
            marginBottom: 10,
            alignment: 'center'
          },
          qrcode: {
            marginTop: 10,
            marginBottom: 10
          },
          bolderText: {
            bold: true,
            marginBottom: 10
          },
          footer: {
            marginBottom: 80
          }
        },
        defaultStyle: {
          fontSize: 12
        }
      })
      pdfDoc.pipe(fs.createWriteStream(path.join(publicPath, 'tmp', filename)));
      const pdfEnd = await pdfDoc.end();

      // on end event upload the file
      return strapi.service('api::document.document').checkFileExist(path.join(publicPath, 'tmp', filename)).then(async () => {
        // prepare the file with meta
        const file = await strapi.service('api::document.document')
          .readAndPrepareFile(path.join(publicPath, 'tmp', filename), filename)

        // upload the file
        const upload = await strapi.service('api::document.document')
          .saveFileToDatabase({data: {}, files: [file]})

        // find the doctype
        const doctype = await strapi.db.query('api::doctype.doctype').findOne(
          {where: {title: 'Dokumentation'}}
        )

        // create media and add to device
        const media = await strapi.entityService.create('api::media.media', {
          data: {
            filename: upload[0].name,
            url: upload[0].id,
            doctype: doctype.id,
            devices: [device.id]
          }
        })

        if (media.id) {
          fs.rmSync(path.join(publicPath, 'tmp', filename))
        }

        return await strapi.entityService.findOne('api::media.media', media.id, {
          populate: ['url']
        })

      })
    } catch (e) {
      console.log(e)
      return e
    }
  },

  /**
   *
   * @param sn
   * @param pass
   * @param locale
   * @return {Promise<Utils.Expression.If<Common.AreSchemaRegistriesExtended, GetValues<string, Utils.Guard.Never<ExtractFields<string, {populate: string[]}["fields"]>, Attribute.GetNonPopulatableKeys<string>>, ExtractPopulate<string, string[]>>, AnyEntity>>}
   */
  mounting: async ({sn, pass, locale}) => {
    const doc = await strapi.db.query('api::document.document').findOne({
      where: {slug: 'mounting', locale},
      populate: true
    })

    const device = await strapi.db.query('api::device.device').findOne({
      where: {sn},
      populate: true
    })

    const filename = `${i18next.t('mounting.filename', {lng: locale})} ${device.sn.toUpperCase()}.pdf`;
    // const appLogin = `https://device-api.powasert.de/customer-login?sn=${device.sn.toUpperCase()}`;
    const printer = new PdfPrinter(fonts);

    try {
      const pdfDoc = printer.createPdfKitDocument({
        pageSize: 'A4',
        pageMargins: [40, 100, 40, 60],
        header: {
          image: path.join(publicPath, doc.header_image.url),
          width: 500,
          style: 'header'
        },
        content: [
          {
            text: doc.title,
            style: 'title'
          },
          {
            text: doc.subtitle,
            style: 'text',
            alignment: 'center'
          },
          {
            text: doc.intro,
            style: 'text',
            alignment: 'left'
          },
          {
            columns: [
              {
                text: 'POWASERT',
                alignment: 'left',
                margin: [140, 0, 0, 0]
              },
              {
                text: device.part.desc,
                alignment: 'left'
              }
            ]
          },
          {
            columns: [
              {
                text: 'Typ:',
                alignment: 'left',
                margin: [140, 0, 0, 0]
              },
              {
                text: device.part.title,
                alignment: 'left'
              }
            ]
          },
          {
            columns: [
              {
                text: 'Fabr. Nr.:',
                alignment: 'left',
                margin: [140, 0, 0, 0]
              },
              {
                text: device.sn.toUpperCase(),
                alignment: 'left'
              }
            ]
          },
          {
            text: doc.content,
            style: 'text',
            alignment: 'left',
            margin: [0, 20, 0, 0]
          },
          {
            image: path.join(publicPath, doc.disclosure_image.url),
            alignment: 'left',
            width: 150,
            margin: [0, 20, 0, 0]
          }
        ],
        footer: {
          image: path.join(publicPath, doc.footer_image.url),
          alignment: 'center',
          width: 500,
          style: 'footer'
        },
        styles: {
          header: {
            marginTop: 20,
            alignment: 'center'
          },
          title: {
            marginTop: 60,
            alignment: 'center',
            fontSize: 16,
            bold: true,
            italics: true,
            marginBottom: 15
          },
          text: {
            marginBottom: 10,
            alignment: 'center'
          },
          qrcode: {
            marginTop: 10,
            marginBottom: 10
          },
          bolderText: {
            bold: true,
            marginBottom: 10
          },
          footer: {
            marginBottom: 80
          }
        },
        defaultStyle: {
          fontSize: 12
        }
      })
      pdfDoc.pipe(fs.createWriteStream(path.join(publicPath, 'tmp', filename)));
      const pdfEnd = await pdfDoc.end();

      // on end event upload the file
      return strapi.service('api::document.document').checkFileExist(path.join(publicPath, 'tmp', filename)).then(async () => {
        // prepare the file with meta
        const file = await strapi.service('api::document.document')
          .readAndPrepareFile(path.join(publicPath, 'tmp', filename), filename)

        // upload the file
        const upload = await strapi.service('api::document.document')
          .saveFileToDatabase({data: {}, files: [file]})

        // find the doctype
        const doctype = await strapi.db.query('api::doctype.doctype').findOne(
          {where: {title: 'Dokumentation'}}
        )

        // create media and add to device
        const media = await strapi.entityService.create('api::media.media', {
          data: {
            filename: upload[0].name,
            url: upload[0].id,
            doctype: doctype.id,
            devices: [device.id]
          }
        })

        if (media.id) {
          fs.rmSync(path.join(publicPath, 'tmp', filename))
        }

        return await strapi.entityService.findOne('api::media.media', media.id, {
          populate: ['url']
        })

      })

    } catch (e) {
      console.log(e)
      return e
    }
  },

  /**
   * Service-Funktion zum Auslesen der Datei aus einem Pfad
   *
   * @param string filePath
   * @param string  fileName
   * @return {Promise<unknown>}
   */
  readAndPrepareFile: (filePath, fileName) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const fileStats = fs.statSync(filePath);
          const fileSizeInBytes = fileStats.size;

          resolve({
            data: Buffer.from(data), // Die Dateidaten als Buffer
            path: filePath,
            type: 'application/pdf', // Der Dateityp (hier als Beispiel 'application/octet-stream')
            name: fileName, // Der Dateiname (hier als Beispiel 'example.jpg')
            size: fileSizeInBytes
          });
        }
      });
    });
  },

  /**
   * Service-Funktion zum Speichern einer Datei aus dem Upload-Plugin in die Datenbank
   * @param {Object} data
   * @param {Object} file - Die hochgeladene Datei
   * @param {Object} options
   */
  async saveFileToDatabase(obj) {
    // Importiere das Upload-Plugin
    const uploadPlugin = strapi.plugins['upload'].services.upload;
    const {getAPIUploadFolder} = strapi.plugins['upload'].services['api-upload-folder'];
    const apiUploadFolder = await getAPIUploadFolder();

    if (Array.isArray(obj.files)) {
      obj.data.fileInfo = obj.data.fileInfo || [];
      obj.data.fileInfo = obj.files.map((_f, i) => ({...obj.data.fileInfo[i], folder: apiUploadFolder.id}));
    } else {
      obj.data.fileInfo = {...obj.data.fileInfo, folder: apiUploadFolder.id};
    }

    //console.log(apiUploadFolder)

    try {
      // Speichere die Datei im Upload-Plugin und erhalte die Dateiinformationen
      const uploadedFile = await uploadPlugin.upload(obj)

      return uploadedFile;
    } catch (error) {
      // Handle Fehler hier
      console.error('Fehler beim Speichern der Datei:', error);
      return error;
    }
  },

  /**
   * Service-Funktion zum prüfen, ob die Datei existiert und lesbar ist
   *
   * @param path
   * @param timeout
   * @return {Promise<unknown>}
   */
  async checkFileExist(path, timeout = 2000) {
    let totalTime = 0;
    let checkTime = timeout / 10;

    return await new Promise((resolve, reject) => {
      const timer = setInterval(function () {

        totalTime += checkTime;

        let fileExists = fs.existsSync(path);

        if (fileExists || totalTime >= timeout) {
          clearInterval(timer);

          resolve(fileExists);

        }
      }, checkTime);
    });
  },

  /**
 * Diese Funktion bereitet die Medien vor und sendet eine E-Mail.
 * @param {Array} medias - Eine Liste von Medien.
 * @param {string} sn - Die Seriennummer des Geräts.
 */
async prepareMediasAndSendEmail(medias = [], sn = '') {
    if (medias.length) {
      // Geräte SN im Subject einfügen
      const attachments = await Promise.all(medias.map(async (media) => {
        const filePath = path.join(publicPath, media.url.url);
        const fileCopy = path.join(publicPath, 'tmp', media.filename);
        fs.copyFileSync(filePath, fileCopy);

        const file = await strapi.service('api::document.document').readAndPrepareFile(fileCopy, media.filename)

        return file
      }))

      const res = await strapi.plugins['email'].services.email.send({
        to: 'info@powasert.de',
        from: 'noreply@media-store.net',
        subject: `Dateien für SN: ${sn} wurden generiert!`,
        html: `<p>Anbei die neuen Dateien</p>`,
        attachments: attachments
      }).then(() => {}).catch((err) => err);

      for (const file of fs.readdirSync(path.join(publicPath, 'tmp'))) {
        if (file !== '.gitkeep') fs.unlinkSync(path.join(publicPath, 'tmp', file));
      }

    }
}
}));
