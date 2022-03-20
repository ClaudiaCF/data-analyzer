var express = require('express');
const _ = require('lodash');
var router = express.Router();

const fs = require('fs');
let rawData = fs.readFileSync('coupons.json');
let coupons = JSON.parse(rawData).coupons;


const getCouponsByType = (promotionType, list) => {
 return _(list)
 .filter((item => item.promotion_type === promotionType)).value()
}

const getCouponsCountByField = (field, fieldName, list) => {
  return _(list)
  .countBy(field)
  .map((value, key) => ({[fieldName]: (key !== 'null' ? key : 'none'), total: value })).value()
}

const getMinValueByField = (field, list) => {
  return _(list)
  .minBy(field).value
}

const getMaxValueByField = (field, list) => {
  return _(list)
  .maxBy(field).value
}

const getAvgValueByField = (field, list) => {
  const avgValue = _(list).meanBy(field)
  return Math.round((avgValue + Number.EPSILON) * 100) / 100
}

const getCouponsMetrics = (coupons) => {
  const couponsPercentOff = getCouponsByType('percent-off', coupons);
  const couponsDollarOff = getCouponsByType('dollar-off', coupons);
  return {
    couponsByType: getCouponsCountByField("promotion_type", 'promotionType', coupons),
    couponsPercentOffDiscountsCount: getCouponsCountByField("value", "value", couponsPercentOff),
    couponsPercentOffMin: getMinValueByField("value", couponsPercentOff),
    couponsPercentOffMax: getMaxValueByField("value", couponsPercentOff),
    couponsPercentOffAvg: getAvgValueByField("value", couponsPercentOff),
    couponsDollarOffDiscountsCount: getCouponsCountByField("value", "value", couponsDollarOff),
    couponsDollarOffMin: getMinValueByField("value", couponsDollarOff),
    couponsDollarOffMax: getMaxValueByField("value", couponsDollarOff),
    couponsDollarOffAvg: getAvgValueByField("value", couponsDollarOff)
  }
}

const allCouponsMetrics = getCouponsMetrics(coupons);

const couponsByRetailer = _(coupons).groupBy('coupon_webshop_name').value()
const metricsByRetailer = Object.entries(couponsByRetailer).map(([retailer,coupons]) => ({
  retailerName: retailer,
  ...getCouponsMetrics(coupons)
}))

const wordsCount = _.countBy(coupons.flatMap(coupon => _.words(`${coupon.title}${coupon.description}`.toLocaleLowerCase())))

const wordsNotNeeded = ['and', 'with', 'the', 'a', 'off', 'to', 'get', 'my', 'another'];

const topWords = _(wordsCount).toPairs()
.filter(([word]) => !(wordsNotNeeded.some((notNeededWord) => notNeededWord === word)) && isNaN(word))
.orderBy([1], ['desc'])
.take(20)
.fromPairs()
.value()

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { 
    couponsMetrics: allCouponsMetrics,
    retailers: metricsByRetailer,
    topWords: topWords
   });
});

module.exports = router;
