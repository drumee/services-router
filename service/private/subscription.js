
// ================================  *
//   Copyright Xialia.com  2013-2019 *
//   FILE  : src/service/private/drumate
//   TYPE  : module
// ================================  *

const { Attr, Remit, Cache } = require("@drumee/server-essentials");

const { isEmpty } = require('lodash');
const { Entity } = require('@drumee/server-core');

//########################################
class __private_subscription extends Entity {

  /**
   * 
   * @param {*} opt 
   */
  initialize(opt) {
    super.initialize(opt);
    this.skey = Cache.getSysConf('stripe_skey');
    let stripe = require('stripe');
    this.stripe = new stripe(this.skey);
  }

  /**
   * 
   */
  async payment_status() {
    const subscription_id = this.input.need("subscription_id");
    let payment = await this.yp.await_proc('payment_status', this.uid, subscription_id);
    this.output.data(payment)
  }

  /**
   * 
   */
  async init() {
    let prods = await this.yp.await_proc('product_get_stripe');

    let param = {};
    let plan = 'pro'
    let unit_amount
    let period
    let recurring = 1

    let stripe_product = await this.stripe.products.search({
      query: `metadata['id'] :'${plan}'`,
    });
    stripe_product = stripe_product.data[0]

    param = {};
    if (isEmpty(stripe_product)) {
      param.name = 'pro';
      param.description = "from app";
      param.metadata = {}
      param.metadata.id = plan
      stripe_product = await this.stripe.products.create(param)
    }

    for (let prod of prods) {

      period = prod.period
      unit_amount = prod.stripe_unit_price
      recurring = prod.recurring

      let stripe_price = await this.stripe.prices.search({
        query: `metadata['unit_amount'] :'${prod.stripe_unit_price}' AND metadata['period'] :'${period}' AND metadata['plan'] :'${plan}' AND  metadata['recurring'] :'${recurring}'`,
      });
      stripe_price = stripe_price.data[0]

      param = {};
      if (isEmpty(stripe_price)) {
        param.unit_amount = prod.stripe_unit_price
        param.currency = 'eur'
        if (recurring == '1') {
          param.recurring = { interval: period }
        }
        param.product = stripe_product.id
        param.metadata = {}
        param.metadata.plan = plan
        param.metadata.period = period
        param.metadata.recurring = recurring
        param.metadata.unit_amount = prod.stripe_unit_price
        param.metadata.price = prod.price
        param.metadata.offer_price = prod.offer_price
        stripe_price = await this.stripe.prices.create(param)
      }
    }

    this.output.data(prods)
  }


  /**
   * 
   */
  async update_clock() {
    this.yp.call_proc('update_stripe_clock', clock_id, flag, this.output.data)
  }

  /**
   * 
   * @returns 
   */
  async new() {
    const plan = 'pro'
    const period = this.input.need("period");
    const recurring = 1;
    let res = {};
    let param = {};
    let drumate = await this.yp.await_proc('drumate_get', this.uid);
    let stripe_customer = await this.stripe.customers.search({
      query: `metadata['id'] :'${this.uid}'`
    });
    stripe_customer = stripe_customer.data[0]
    if (isEmpty(stripe_customer)) {
      let test_clock_on = Cache.getSysConf('stripe_testclock_on')
      let test_clock = Cache.getSysConf('stripe_testclock')
      if (test_clock_on == 1) {
        if (!isEmpty(test_clock)) {
          param.test_clock = test_clock
        }
      }
      param.email = drumate.email;
      param.name = drumate.firstname;
      param.description = "from app";
      param.metadata = {}
      param.metadata.id = drumate.id
      stripe_customer = await this.stripe.customers.create(param)
    }

    let mysubscription = await this.yp.await_proc('subscription_get', this.uid);
    if (!isEmpty(mysubscription)) {
      if (mysubscription.status == 'incomplete') {
        await this.stripe.subscriptions.del(mysubscription.subscription_id)
      }

      if (mysubscription.status == 'active') {
        res.status = 'ACTIVE_SUBSCRIPTION';
        return this.output.data(res)
      }

    }

    let product = await this.yp.await_proc('product_get', plan, period, recurring);
    let stripe_product = await this.stripe.products.search({
      query: `metadata['id'] :'${plan}'`,
    });
    stripe_product = stripe_product.data[0]

    param = {};
    if (isEmpty(stripe_product)) {
      param.name = 'Pro';
      param.description = "from app";
      param.metadata = {}
      param.metadata.id = plan
      stripe_product = await this.stripe.products.create(param)
    }

    let stripe_price = await this.stripe.prices.search({
      query: `metadata['unit_amount'] :'${product.stripe_unit_price}' AND metadata['period'] :'${period}' AND metadata['plan'] :'${plan}' AND  metadata['recurring'] :'${recurring}'`,
    });
    stripe_price = stripe_price.data[0]

    param = {};
    if (isEmpty(stripe_price)) {
      param.unit_amount = product.stripe_unit_price
      param.currency = 'eur'
      if (recurring == '1') {
        param.recurring = { interval: period }
      }
      param.product = stripe_product.id
      param.metadata = {}
      param.metadata.plan = plan
      param.metadata.period = period
      param.metadata.recurring = recurring
      param.metadata.price = product.price
      param.metadata.offer_price = product.offer_price
      param.metadata.unit_amount = product.stripe_unit_price
      stripe_price = await this.stripe.prices.create(param)
    }

    param = {};
    param.mode = 'subscription'
    param.subscription_data = {}
    param.subscription_data.metadata = { entity_id: this.uid, ...stripe_price.metadata }
    param.success_url = this.input.servicepath({ service: 'callback.check_out_success' }) + '&session_id={CHECKOUT_SESSION_ID}';
    param.cancel_url = this.input.servicepath({ service: 'callback.check_out_cancel' }) + '&bar1=a&bar2=b';
    param.cancel_url = `${this.input.servicepath({ service: 'callback.check_out_cancel' })}&drumate_id=${this.uid}&session_id={CHECKOUT_SESSION_ID}`;
    param.line_items = [{ price: stripe_price.id, quantity: 1 }]
    param.customer = stripe_customer.id
    param.metadata = {}
    param.metadata.id = drumate.id
    const session = await this.stripe.checkout.sessions.create(param);
    res.session = session
    this.output.data(res)
  }


  /**
   * 
   * @returns 
   */
  async proration() {
    const plan = 'pro'
    const period = this.input.need("period");
    const recurring = 1;

    let res = {};
    let param = {}

    let stripe_product = await this.stripe.products.search({
      query: `metadata['id'] :'${plan}'`,
    });
    stripe_product = stripe_product.data[0]
    let stripe_customer = await this.stripe.customers.search({
      query: `metadata['id'] :'${this.uid}'`
    });

    if (stripe_customer.data.length == 0) {
      res.status = 'NO_CUSTOMER';
      return this.output.data(res)
    }
    stripe_customer = stripe_customer.data[0]

    let stripeSub = await this.stripe.subscriptions.list({ customer: stripe_customer.id });

    if (stripeSub.data.length == 0) {
      res.status = 'NO_SUBSCRIPTION';
      return this.output.data(res)
    }
    stripeSub = stripeSub.data[0];

    let product = await this.yp.await_proc('product_get', plan, period, recurring);


    let stripe_price = await this.stripe.prices.search({
      query: `metadata['unit_amount'] :'${product.stripe_unit_price}' AND metadata['period'] :'${period}' AND metadata['plan'] :'${plan}' AND  metadata['recurring'] :'${recurring}'`,
    });
    stripe_price = stripe_price.data[0]


    param = {};
    if (isEmpty(stripe_price)) {
      param.unit_amount = product.stripe_unit_price
      param.currency = 'eur'
      if (recurring == '1') {
        param.recurring = { interval: period }
      }
      param.product = stripe_product.id
      param.metadata = {}
      param.metadata.plan = plan
      param.metadata.period = period
      param.metadata.recurring = recurring
      param.metadata.price = product.price
      param.metadata.offer_price = product.offer_price
      param.metadata.unit_amount = product.stripe_unit_price

      stripe_price = await this.stripe.prices.create(param)
    }

    let subscription = await this.stripe.subscriptions.retrieve(stripeSub.id);

    const items = [{
      id: subscription.items.data[0].id,
      price: stripe_price.id // Switch to new price
    }];



    let proration_date = Math.floor(Date.now() / 1000);
    let test_clock_on = Cache.getSysConf('stripe_testclock_on')
    let test_clock = Cache.getSysConf('stripe_testclock')
    if (test_clock_on == 1) {
      if (!isEmpty(test_clock)) {
        const testClock = await this.stripe.testHelpers.testClocks.retrieve(test_clock);
        proration_date = testClock.frozen_time
      }
    }

    const invoice = await this.stripe.invoices.retrieveUpcoming({
      customer: stripe_customer.id,
      subscription: stripeSub.id,
      subscription_items: items,
      subscription_proration_date: proration_date,
    });

    let proration_item = invoice.lines.data.find(function (e) {
      return e.type == 'invoiceitem';
    });

    res.proration_item = proration_item
    let subscription_item = invoice.lines.data.find(function (e) {
      return e.type == 'subscription';
    });
    res.subscription_item = subscription_item
    this.output.data(res)
  }

  /**
   * 
   * @returns 
   */
  async update() {
    const plan = 'pro'
    const period = this.input.need("period");
    const recurring = 1;
    let res = {};
    let param = {}

    let stripe_product = await this.stripe.products.search({
      query: `metadata['id'] :'${plan}'`,
    });
    stripe_product = stripe_product.data[0]
    let stripe_customer = await this.stripe.customers.search({
      query: `metadata['id'] :'${this.uid}'`
    });
    stripe_customer = stripe_customer.data[0]

    let stripeSub = await this.stripe.subscriptions.list({ customer: stripe_customer.id });

    if (stripeSub.data.length == 0) {
      res.status = 'NO_SUBSCRIPTION';
      return this.output.data(res)
    }
    stripeSub = stripeSub.data[0];

    let product = await this.yp.await_proc('product_get', plan, period, recurring);


    let stripe_price = await this.stripe.prices.search({
      query: `metadata['unit_amount'] :'${product.stripe_unit_price}' AND metadata['period'] :'${period}' AND metadata['plan'] :'${plan}' AND  metadata['recurring'] :'${recurring}'`,
    });
    stripe_price = stripe_price.data[0]


    param = {};
    if (isEmpty(stripe_price)) {
      param.unit_amount = product.stripe_unit_price
      param.currency = 'eur'
      if (recurring == '1') {
        param.recurring = { interval: period }
      }
      param.product = stripe_product.id
      param.metadata = {}
      param.metadata.plan = plan
      param.metadata.period = period
      param.metadata.recurring = recurring
      param.metadata.price = product.price
      param.metadata.offer_price = product.offer_price
      param.metadata.unit_amount = product.stripe_unit_price

      stripe_price = await this.stripe.prices.create(param)
    }

    let subscription = await this.stripe.subscriptions.retrieve(stripeSub.id);
    param = {};
    param.proration_behavior = 'create_prorations',
      param.cancel_at_period_end = false
    param.metadata = { entity_id: this.uid, ...stripe_price.metadata }

    param.items = [{
      id: subscription.items.data[0].id,
      price: stripe_price.id,
    }]

    let session = await this.stripe.subscriptions.update(stripeSub.id, param);
    res = {
      current_period_end: session.current_period_end,
      current_period_start: session.current_period_start,
      status: session.status,
    };

    this.output.data(res)

  }

  /**
   * 
   */
  async cancel() {
    let res = {};
    let param = {}


    let stripe_customer = await this.stripe.customers.search({
      query: `metadata['id'] :'${this.uid}'`
    });

    if (stripe_customer.data.length == 0) {
      res.status = 'NO_COUSTOMER';
      return this.output.data(res)
    }

    stripe_customer = stripe_customer.data[0]

    let subscription_curr = await this.stripe.subscriptions.list({ customer: stripe_customer.id });

    if (subscription_curr.data.length == 0) {
      res.status = 'NO_SUBSCRIPTION';
      return this.output.data(res)
    }

    subscription_curr = subscription_curr.data[0];
    res.subscription_curr = subscription_curr


    let invoice_id = subscription_curr.latest_invoice
    const invoice = await this.stripe.invoices.retrieve(invoice_id);
    res.invoice = invoice
    if (invoice.status == 'draft') {
      res.status = 'DARFT_INVOICE';
      return this.output.data(res)
    }
    let renewal = await this.yp.await_proc('renewal_get_next', this.uid, 0);

    param = {}
    param.cancel_at_period_end = 'true'
    const subscription = await this.stripe.subscriptions.update(subscription_curr.id, param);
    res.subscription = subscription

    await this.yp.await_proc('renewal_cancel_next', this.uid, subscription.cancel_at);
    res.renewal = await this.yp.await_proc('renewal_get_next', this.uid, 0);
    this.output.data(res);
  }

  /**
   * 
   * @returns 
   */
  async active() {
    let res = {};
    let param = {};

    let stripe_customer = await this.stripe.customers.search({
      query: `metadata['id'] :'${this.uid}'`
    });

    if (stripe_customer.data.length == 0) {
      res.status = 'NO_COUSTOMER';
      return this.output.data(res)
    }

    stripe_customer = stripe_customer.data[0]

    let subscription_curr = await this.stripe.subscriptions.list({ customer: stripe_customer.id });

    if (subscription_curr.data.length == 0) {
      res.status = 'NO_SUBSCRIPTION';
      return this.output.data(res)
    }

    subscription_curr = subscription_curr.data[0];
    res.subscription_curr = subscription_curr

    param = {}
    param.cancel_at_period_end = 'false'
    const subscription = await this.stripe.subscriptions.update(subscription_curr.id, param);
    res.subscription = subscription

    await this.yp.await_proc('renewal_active', this.uid);
    res.renewal = await this.yp.await_proc('renewal_get_next', this.uid, 0);
    this.output.data(res)
  }

  /**
   * 
   * @returns 
   */
  async schedule() {
    const plan = 'pro'
    const period = this.input.need("period");
    const recurring = 1;
    let res = {};
    let param = {}


    // pick the customer id 
    let stripe_customer = await this.stripe.customers.search({
      query: `metadata['id'] :'${this.uid}'`
    });
    stripe_customer = stripe_customer.data[0]

    //chk any upcomming schedule
    let oldsubscriptionSchedule = await this.stripe.subscriptionSchedules.list({ customer: stripe_customer.id });
    if (!isEmpty(oldsubscriptionSchedule.data)) {
      res.oldsubscriptionSchedule = oldsubscriptionSchedule
      res.status = 'HAVING_UPCOMMING_SCHDULED_PLAN ';
      return this.output.data(res)
    }


    // Find the price id
    let stripe_price = await this.stripe.prices.search({
      query: `metadata['period'] :'${period}' AND metadata['plan'] :'${plan}' AND  metadata['recurring'] :'${recurring}'`,
    });
    stripe_price = stripe_price.data[0]

    // Pick the current subscription
    let subscription_curr = await this.stripe.subscriptions.list({ customer: stripe_customer.id });
    subscription_curr = subscription_curr.data[0];
    res.subscription_curr = subscription_curr

    // create a new upcomming schedule for the 
    param = {}
    param.customer = stripe_customer.id
    param.start_date = subscription_curr.current_period_end  // set the start date as the current subscription end date
    param.phases = [
      {
        collection_method: 'charge_automatically',
        default_payment_method: subscription_curr.default_payment_method, //This the important point 
        items: [
          {
            price: stripe_price.id,
            quantity: 1,
          },
        ],
      },
    ]
    const subscriptionSchedule = await this.stripe.subscriptionSchedules.create(param)
    res.subscriptionSchedule = subscriptionSchedule


    // release any shedule from the  current subscription
    if (!isEmpty(subscription_curr.schedule)) {
      await this.stripe.subscriptionSchedules.release(subscription_curr.schedule);
    }

    // Cancel current subscription
    param = {}
    param.cancel_at_period_end = 'true'
    const subscription = await this.stripe.subscriptions.update(subscription_curr.id, param);
    res.subscription = subscription
    this.output.data(res)
  }

  /**
   * 
   * @returns 
   */
  async get_plans() {
    let entity_id = this.uid
    const dom_id = this.user.domain_id()

    let res = {};
    if (dom_id != 1) {

      let my_privilege = await this.yp.await_proc('domain_privilege', dom_id, this.uid);
      if (my_privilege.privilege < Remit.dom_admin_memeber) {
        res.status = 'NOT_ENOUGH_PRIVILEGE';
        return this.output.data(res)
      }

      let org = await this.yp.await_proc('organisation_get', dom_id)
      entity_id = org.id;
    }

    res.plans = []
    let plans = await this.yp.await_proc('plans_get', entity_id);
    for (let plan of plans) {
      plan.plan_detail = this.parseJSON(plan.plan_detail)
      plan.metadata = this.parseJSON(plan.metadata)
      res.plans.push(plan)
    }

    let current_date = 0
    let test_clock_on = Cache.getSysConf('stripe_testclock_on')
    let test_clock = Cache.getSysConf('stripe_testclock')
    if (test_clock_on == 1) {
      if (!isEmpty(test_clock)) {
        const testClock = await this.stripe.testHelpers.testClocks.retrieve(test_clock);
        current_date = testClock.frozen_time
      }
    }

    res.renewal = await this.yp.await_proc('renewal_get_next', entity_id, current_date);
    this.output.data(res)
  }


  /**
   * 
   */
  async invoice() {
    let entity_id = this.uid
    let page = this.input.use(Attr.page, 1);
    this.yp.call_proc('renewal_history_get', entity_id, page, this.output.list);
  }


}
module.exports = __private_subscription;
