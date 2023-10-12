'use strict';

/**
 * document service
 */

const {createCoreService} = require('@strapi/strapi').factories;

const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');

// Pfad zum öffentlichen Verzeichnis
const publicPath = path.resolve(__dirname, '../../../../public');


var fonts = {
  Roboto: {
    normal: path.join(publicPath, '/fonts/Roboto/Roboto-Regular.ttf'),
    bold: path.join(publicPath, '/fonts/Roboto/Roboto-Medium.ttf'),
    italics: path.join(publicPath, '/fonts/Roboto/Roboto-Italic.ttf'),
    bolditalics: path.join(publicPath, '/fonts/Roboto/Roboto-MediumItalic.ttf')
  }
}

module.exports = createCoreService('api::document.document', ({strapi}) => ({

  qrcode: async ({sn, pass}) => {
    const doc = await strapi.db.query('api::document.document').findOne({
      where: {slug: 'qrcode'},
      populate: ['header_image.url', 'disclosure_image.url', 'footer_image.url']
    })

    const device = await strapi.db.query('api::device.device').findOne({
      where: {sn}
    })

    const filename = `Passwort und QR-Code_${device.sn.toUpperCase()}.pdf`;
    const appLogin = `https://device-api.powasert.de/customer-login?sn=${device.sn.toUpperCase()}`;
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
            text: 'Tauchen Schwierigkeiten auf?',
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
            text: 'Kein Grund zur Panik – Fragen Sie uns!',
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
      pdfDoc.end();

      //TODO upload and set as entity to device
    } catch (e) {
      console.log(e)
    }

  },
  confirmity: async ({sn}) => {
    const doc = await strapi.db.query('api::document.document').findOne({
      where: {slug: 'confirmity'},
      populate: true
    })

    const device = await strapi.db.query('api::device.device').findOne({
      where: {sn},
      populate: true
    })

    const filename = `Einbauerklärung ${device.sn.toUpperCase()}.pdf`;
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
      pdfDoc.end();

      //TODO upload and set as entity to device
    } catch (e) {
      console.log(e)
    }
  }
}));
