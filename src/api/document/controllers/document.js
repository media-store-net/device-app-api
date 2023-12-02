'use strict';

/**
 * document controller
 */

const {createCoreController} = require('@strapi/strapi').factories;

module.exports = createCoreController('api::document.document', ({strapi}) => ({
  async createPdf(ctx) {
    const {sn, pass, docs, locale} = ctx.request.body.data;

    if (docs.length) {
      const res = await Promise.all(docs.map(async (doc) => {
        try {
          return await strapi.service('api::document.document')[doc]({sn, pass, locale});
        } catch (e) {
          console.log(e)
          return e
        }
      }))

      const send = await strapi.service('api::document.document')
        .prepareMediasAndSendEmail(res, sn)

      return res;
    }

  }
}));
