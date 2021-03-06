const axios = require('axios');
const _ = require('lodash')
const keys = require('../config/keys')
const version = keys.SHOPIFY_API_VERSION

const {
    getHeaders, 
    cleanOrders, 
    combineOrdersAndEmailRules, 
    combineOrdersAndSentHistory
} = require('./orders-helper')


async function getOrders(ctx) {
    try {        
        const limit = keys.PAGE_SIZE
        const {shop, accessToken} = ctx.session
        let {page, date} = ctx.query     
        let hasPrevious = true; let hasNext = true
        const headers = getHeaders(accessToken)
        
        if (date) {            
            date = new Date(date)          
            let endDate = new Date(date).setDate(date.getDate() + 1)
                        
            date = {
                created_at_min: date.toISOString(),
                created_at_max: new Date(endDate).toISOString()
            }
        } else {
            date = {}
        }

        const total = await axios.get(`https://${shop}/admin/api/${version}/orders/count.json`, {
            headers,
            params: date
        })        
        const totalPages = Math.ceil(total.data.count / limit)        
        if (page == totalPages || totalPages == 0) hasNext = false
        if (page == 1) hasPrevious = false

        let orders = await axios.get(`https://${shop}/admin/api/${version}/orders.json`, {
            headers,
            params: {
                limit,
                page,
                ...date
            }
        })

        orders = await cleanOrders(orders.data.orders)
        orders = await combineOrdersAndEmailRules(shop, orders)
        orders = await combineOrdersAndSentHistory(orders)
        

        ctx.body = {orders, hasPrevious, hasNext, page}
    } catch (err) {
        console.log('Failed getting orders: ', err)
        ctx.status = 400
    }
}

module.exports = {getOrders}