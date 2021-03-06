{
  ("use strict");

  const select = {
    templateOf: {
      menuProduct: "#template-menu-product",
      cartProduct: "#template-cart-product", // CODE ADDED
    },
    containerOf: {
      menu: "#product-list",
      cart: "#cart",
    },
    all: {
      menuProducts: "#product-list > .product",
      menuProductsActive: "#product-list > .product.active",
      formInputs: "input, select",
    },
    menuProduct: {
      clickable: ".product__header",
      form: ".product__order",
      priceElem: ".product__total-price .price",
      imageWrapper: ".product__images",
      amountWidget: ".widget-amount",
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: "input.amount", // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: ".cart__order-summary",
      toggleTrigger: ".cart__summary",
      totalNumber: `.cart__total-number`,
      totalPrice:
        ".cart__total-price strong, .cart__order-total .cart__order-price-sum strong",
      subtotalPrice: ".cart__order-subtotal .cart__order-price-sum strong",
      deliveryFee: ".cart__order-delivery .cart__order-price-sum strong",
      form: ".cart__order",
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: ".widget-amount",
      price: ".cart__product-price",
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: "active",
      imageVisible: "active",
    },
    // CODE ADDED START
    cart: {
      wrapperActive: "active",
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
    db: {
      url: "//localhost:3131",
      products: "products",
      orders: "orders",
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(
      document.querySelector(select.templateOf.menuProduct).innerHTML
    ),
    // CODE ADDED START
    cartProduct: Handlebars.compile(
      document.querySelector(select.templateOf.cartProduct).innerHTML
    ),
    // CODE ADDED END
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      console.log("data", data);

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

      // console.log("new Product:", thisProduct);
    }
    renderInMenu() {
      const thisProduct = this;
      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);

      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }
    getElements() {
      const thisProduct = this;
      thisProduct.accordionTrigger = thisProduct.element.querySelector(
        select.menuProduct.clickable
      );
      thisProduct.form = thisProduct.element.querySelector(
        select.menuProduct.form
      );
      thisProduct.formInputs = thisProduct.form.querySelectorAll(
        select.all.formInputs
      );
      thisProduct.cartButton = thisProduct.element.querySelector(
        select.menuProduct.cartButton
      );
      thisProduct.priceElem = thisProduct.element.querySelector(
        select.menuProduct.priceElem
      );
      thisProduct.imageWrapper = thisProduct.element.querySelector(
        select.menuProduct.imageWrapper
      );
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(
        select.menuProduct.amountWidget
      );
    }
    initAccordion() {
      const thisProduct = this;
      const productList = document.querySelector("#product-list");
      thisProduct.accordionTrigger.addEventListener("click", function (event) {
        event.preventDefault();
        const activeProduct = productList.querySelector(
          select.all.menuProductsActive
        );
        if (activeProduct != null && activeProduct != thisProduct.element) {
          activeProduct.classList.remove("active");
        }
        thisProduct.element.classList.toggle("active");
      });
    }
    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener(
        "updated",
        function (event) {
          thisProduct.processOrder();
          // console.log("updated funkcja");
        }
      );
    }
    initOrderForm() {
      const thisProduct = this;
      // console.log('order form', thisProduct);
      thisProduct.form.addEventListener("submit", function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener("change", function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener("click", function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      // console.log('formData', formData);

      // set price to default price
      let price = thisProduct.data.price;
      //  console.log('price:', price);
      // for every category (param)...

      for (let paramId in thisProduct.data.params) {
        // console.log("test test");
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'
        const param = thisProduct.data.params[paramId];
        //  console.log('param id, param:', paramId, param);
        // for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          //   console.log('option id, option:',optionId, option);
          // check if there is param with a name of paramId in formData and if it includes optionId
          const optionSelected =
            formData[paramId] && formData[paramId].includes(optionId);
          if (optionSelected) {
            if (!option.default) {
              price += option.price;
            }
          } else {
            if (option.default) {
              price -= option.price;
            }
          }
          const optionImage = thisProduct.imageWrapper.querySelector(
            `.${paramId}-${optionId}`
          );
          // console.log(`.${paramId}-${optionId}`);
          // console.log('image', optionImage);
          if (optionImage) {
            // Yes! We've found it!
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }

      thisProduct.priceSingle = price;
      // console.log("single price", thisProduct.priceSingle);
      //MULTIPLY PRICE BY AMOUNT
      price *= thisProduct.amountWidget.value;
      //  console.log("price", price);

      // update calculated price in the HTML
      thisProduct.priceElem.innerHTML = price;
    }

    addToCart() {
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct());
    }
    prepareCartProduct() {
      const thisProduct = this;
      const productSummary = {};
      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = productSummary.priceSingle * productSummary.amount;
      productSummary.params = thisProduct.prepareCartProductParams();
      return productSummary;
    }
    prepareCartProductParams() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};
      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options: {},
        };
        for (let optionId in param.options) {
          const option = param.options[optionId];
          const optionSelected =
            formData[paramId] && formData[paramId].includes(optionId);

          if (optionSelected) {
            params[paramId].options[optionId] = option.label;
          }
        }
      }
      return params;
    }
  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      // console.log("this widget", thisWidget);
      // console.log("constructor", element);
      thisWidget.getElements(element);

      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(
        select.widgets.amount.input
      );
      thisWidget.linkDecrease = thisWidget.element.querySelector(
        select.widgets.amount.linkDecrease
      );
      thisWidget.linkIncrease = thisWidget.element.querySelector(
        select.widgets.amount.linkIncrease
      );
    }
    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);

      //add validation
      if (thisWidget.value != newValue && !isNaN(newValue)) {
        thisWidget.value = newValue;
      }
      thisWidget.value = newValue;
      thisWidget.input.value = thisWidget.value;

      thisWidget.announce();
    }
    initActions() {
      const thisWidget = this;

      thisWidget.input.addEventListener("change", function () {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener("click", function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener("click", function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce() {
      const thisWidget = this;

      const event = new CustomEvent("updated", {
        bubbles: true,
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element) {
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      // console.log("new Cart", thisCart);
      thisCart.initActions();
    }
    getElements(element) {
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
        select.cart.toggleTrigger
      );
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(
        select.cart.productList
      );
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(
        select.cart.deliveryFee
      );
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(
        select.cart.subtotalPrice
      );
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(
        select.cart.totalPrice
      );
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(
        select.cart.totalNumber
      );
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(
        select.cart.phone
      );
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(
        select.cart.address
      );
    }
    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener("click", function (event) {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener("updated", function () {
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener("remove", function () {
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener("submit", function (event) {
        event.preventDefault();
        thisCart.sendOrder();
      });
    }
    add(menuProduct) {
      const thisCart = this;

      /* generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct);

      /* create element using utils.createElementFromHTML */
      const domElement = utils.createDOMFromHTML(generatedHTML);
      //console.log("dom elelemnt", domElement);
      // /* find menu container */
      // const cartContainer = document.querySelector(select.containerOf.cart);

      /* add element to menu */
      thisCart.dom.productList.appendChild(domElement);
      thisCart.products.push(new CartProduct(menuProduct, domElement));
      //console.log("thisCart Products", thisCart.products);
      thisCart.update();
    }
    update() {
      const thisCart = this;
      let deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subTotalPrice = 0;
      for (let product of thisCart.products) {
        thisCart.totalNumber += product.amount;
        thisCart.subTotalPrice += product.price;
        console.log(thisCart.totalNumber, thisCart.subTotalPrice);
      }
      if (thisCart.totalNumber) {
        thisCart.totalPrice = thisCart.subTotalPrice + deliveryFee;
      } else {
        thisCart.totalPrice = thisCart.subTotalPrice;
        deliveryFee = 0;
      }
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subTotalPrice;

      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
      //TotalPrice is not iratable
      for (let totalPrice of thisCart.dom.totalPrice) {
        totalPrice.innerHTML = thisCart.totalPrice;
      }
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    }
    remove(productRemove) {
      const thisCart = this;
      const indexOfproductRemove = thisCart.products.indexOf(productRemove);
      const removedProduct = thisCart.products.splice(indexOfproductRemove, 1);

      thisCart.update();
    }
    sendOrder() {
      const thisCart = this;
      const url = settings.db.url + "/" + settings.db.orders;
      const payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subTotalPrice - thisCart.dom.deliveryFee,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.dom.deliveryFee,
        products: [],
      };
      for (let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      fetch(url, options);
    }
  }
  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;

      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;

      thisCartProduct.getElements(element);
      // console.log("cart Product", thisCartProduct);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }
    getElements(element) {
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amount = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.amountWidget
      );
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.price
      );
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.edit
      );
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.remove
      );
    }
    initAmountWidget() {
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(
        thisCartProduct.dom.amount
      );

      thisCartProduct.dom.amount.addEventListener("updated", function (event) {
        thisCartProduct.price =
          thisCartProduct.priceSingle * thisCartProduct.amountWidget.value;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }
    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent("remove", {
        bubbles: true,
        detail: {
          catProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener("click", function (event) {
        event.preventDefault();
      });

      thisCartProduct.dom.remove.addEventListener("click", function (event) {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    getData() {
      const thisCartProduct = this;
      const order = [];
      order.id = thisCartProduct.id;
      order.amount = thisCartProduct.amountWidget.value;
      order.priceSingle = thisCartProduct.priceSingle;
      // order.name = thisCartProduct.name;
      order.params = thisCartProduct.params;
      order.price = thisCartProduct.price;
      return order;
    }
  }
  const app = {
    initMenu: function () {
      const thisApp = this;

      // console.log('thisApp.data:', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(
          thisApp.data.products[productData].id,
          thisApp.data.products[productData]
        );
      }
    },

    initData: function () {
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + "/" + settings.db.products;
      fetch(url)
        .then(function (rawResponse) {
          return rawResponse.json();
        })
        .then(function (parsedResponse) {
          console.log("parsedResponse", parsedResponse);

          //save parsedResponse as thisApp.data.products
          thisApp.data.products = parsedResponse;
          //execute initMenu methof
          thisApp.initMenu();
        });
      console.log("thisApp.data", JSON.stringify(thisApp.data));
    },

    initCart: function () {
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
    init: function () {
      const thisApp = this;

      // console.log("*** App starting ***");
      // console.log("thisApp:", thisApp);
      // console.log("classNames:", classNames);
      // console.log("settings:", settings);
      // console.log("templates:", templates);

      thisApp.initData();
      //thisApp.initMenu();
    },
  };

  app.init();
  app.initCart();
}
