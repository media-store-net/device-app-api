"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  customer_login: async (ctx) => {
    const body = await ctx.request.body;
    console.log(body);
    const customer = await strapi.query('Companies').findOne({
      kdnr: body.sn,
      pass: body.pass
    });
    const device = await strapi.query('Devices').findOne({
      sn: body.sn,
      pass: body.pass
    });

    if (customer && customer.kdnr === body.sn && customer.pass === body.pass) {
      const devices = await strapi.query('Devices').find({'companie.kdnr': customer.kdnr});
      ctx.send(devices);
    } else if (device && device.sn === body.sn && device.pass === body.pass) {
      ctx.send(device)
    } else {
      ctx.unauthorized(`Keine Übereinstimmung gefunden. Bitte Prüfe die Zugangsdaten!`);
    }
  },
};
