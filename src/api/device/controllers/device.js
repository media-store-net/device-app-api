'use strict';

/**
 *  device controller
 */

const {createCoreController} = require('@strapi/strapi').factories;

module.exports = createCoreController('api::device.device', ({strapi}) => ({
    /*sanitizeOutput(device) {
      const {
        pass, password, resetPasswordToken, confirmationToken, ...sanitizedDevice
      } = device; // be careful, you need to omit other private attributes yourself
      return sanitizedDevice;
    },*/

    async customerLogin(ctx) {
      try {
        const reqBody = ctx.request.body;
        let devices = []
        // Find Customer
        if (!isNaN(Number(reqBody.sn))) {
          const customer = await strapi.db.query('api::companie.companie').findOne({
            where: {
              kdnr: {$eq: Number(reqBody.sn)}
            },
          })
            .then(async (companie) => {
              if (await strapi.plugins['users-permissions'].services.user.validatePassword(reqBody.pass, companie.pass)) {
                devices = await strapi.db.query('api::device.device').findMany({
                  where: {companie: {id: companie.id}}, populate: ['companie', 'part', 'media.url', 'media.doctype']
                });
                ctx.status = 200;
                ctx.body = {
                  data: devices.map(device => {
                    delete device.companie.pass;
                    delete device.pass;
                    return device
                  })
                }
                return true
              } else {
                return ctx.unauthorized();
              }
            }).catch(err => console.error(err))
        }

        // Find Device
        const device = await strapi.db.query('api::device.device').findOne({
          where: {
            sn: reqBody.sn
          },
          populate: ['companie', 'part', 'media.url', 'media.doctype']
        })
          .then(async (device) => {
            if (await strapi.plugins['users-permissions'].services.user.validatePassword(reqBody.pass, device.pass)) {
              delete device.companie.pass;
              delete device.pass;
              devices.push(device)
              ctx.status = 200;
              ctx.body = {data: devices}
              return true
            } else {
              return ctx.unauthorized();
            }
          })
          .catch(err => console.error(err))

      } catch (err) {
        console.log(err)
        ctx.body = err
      }
    }
  })
);
