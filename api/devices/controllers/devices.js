"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    customer_login: async (ctx) => {
        const body = await ctx.request.body;
        console.log(body);
        const device = await strapi.query('Devices').findOne({
            sn: body.sn,
            pass: body.pass
        });

        if (device && device.sn === body.sn && device.pass === body.pass) {
            ctx.send(device)
        }
        else {
            ctx.unauthorized(`You're not logged in!`);
        }
    },
};
