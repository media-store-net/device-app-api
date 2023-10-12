'use strict';

/**
 * document controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::document.document', ({strapi})=> ({
  async createPdf(ctx) {
    const {sn, pass, docs} = ctx.request.body;
    console.log({sn, pass, docs})
    await strapi.service('api::document.document').confirmity({sn});
  }
}));
