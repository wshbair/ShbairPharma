const utils = require("./utils");

// ── Build product card  ────────────────────────────────────────────
const buildProductCard = (item) => {
    item.price = parseFloat(item.price).toFixed(2);
    let item_isExpired = utils.isExpired(item.expirationDate);
    const dayToExpire = utils.daysToExpire(item.expirationDate)
    let item_stockStatus = utils.getStockStatus(item.quantity, item.minStock);

    return `<div class="col-lg-2 box ${item.category}"
                onclick="$(this).addToCart(${item._id}, ${item.quantity}, ${item.stock})">
              <div class="widget-panel widget-style-2 ${item_isExpired || item_stockStatus < 1 ? "widget-style-danger" : ""}" title="${item.name}">
                <div class="text-muted m-t-5 text-center">
                  <div class="name" id="product_name">
                    <span class="${item_isExpired ? "text-danger" : ""}">${item.name}</span>
                  </div>
                  <span class="stock"> Exp. in ${dayToExpire} days</span>
                </div>
                 <span class="${item_stockStatus < 1 ? "text-danger" : ""}">
                    <span class="stock" data-i18n="stock">Stock </span>
                    <span class="count">${item.stock == 1 ? item.quantity : "N/A"}</span>
                  </span>
                <span class="text-success text-center">
                  <b>${utils.moneyFormat(item.price)}</b>
                </span>
              </div>
            </div>`;
  }

  module.exports = {
    buildProductCard
  }