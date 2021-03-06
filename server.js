// Shopify Partners Login
// https://partners.shopify.com
// For development use ngrok tunneling 
// ~/ngrok http 3000
// If ngrok pro option
// ~/ngrok http 3000 -subdomain=scottshopify
// https://scottshopify.ngrok.io
// URLs to whitelist on Partners dashboard
// App URL: https://scottshopify.ngrok.io/
// Whitelisted Redirection: https://scottshopify.ngrok.io/auth/callback, https://scottshopify.ngrok.io/auth
// To Run App
// {forwarding address}/shopify?shop={shop name}.myshopify.com
// https://scottshopify.ngrok.io/auth?shop=miraekomerco.myshopify.com

// next.js takes care of:
// webpack configuration
// hot module replacement
// server-side rendering
// production setup
// client-side routing
// updating babel configuration
// code splitting

// koa uses async/await. Using the original promises will not work
if (process.env.NODE_ENV != 'production') {
    require('dotenv').config({path: __dirname + '/.env'})
}
require('isomorphic-fetch');
require('./config/config');
require('./server/db/mongoose'); //If using DB
//koa and koa-session will take care of Shopify OAuth and create a custom server
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const session = require('koa-session');
//package exposes "shopifyAuth" by default. We're changing that to "createShopifyAuth"
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const next = require('next');
const compression = require('compression');
const koaConnect = require('koa-connect');

const {processPayment, changeSubscription} = require('./server/payment/shopify-payment');
const getUser = require('./server/get-user');
const contactUs = require('./server/contact-us');
const getProducts = require('./server/get-products');
const getRules = require('./server/get-rules');
const {getOrders} = require('./server/get-orders');
const {getOrderPDFPreview, getPDFPreview} = require ('./server/pdf')
const {getSettings, setSendMethod, setTemplateText, setPDFOrderLimit, setEmail, setSelfEmailCopy} = require('./server/settings');
const {sendOrders, getAllOrdersForDay} = require('./server/send-orders');
const {sendOrdersForShops, sendOrdersCron} = require('./server/cron-orders');
const {addRule, editRule, removeRule} = require('./server/edit-rule');
const {shopifyAuth, switchSession} = require('./server/auth/shopify-auth');
const {getTokens, gmailLogout} = require('./server/auth/gmail-auth');
const {getProductUrl, getProductImageUrl} = require('./server/custom-data')
const {appUninstalled} = require('./server/webhooks/app-uninstalled');
const {dataRequest, customerRedact, shopRedact} = require('./server/webhooks/gdpr');

const port = parseInt(process.env.PORT, 10) || 3000;

const dev = process.env.NODE_ENV !== 'production';
//app refers to the Next.js app, which is the react build
const app = next({ dev });
const handle = app.getRequestHandler();
const { SHOPIFY_API_SECRET_KEY } = process.env;

const whitelist = [    
    '/_next',
    '/static',
    '/home',
    '/authenticate',
    '/privacy-policy',
    '/terms-of-service'
]
async function handleRender(ctx) {        
    await handle(ctx.req, ctx.res);    
    ctx.respond = false;
    ctx.res.statusCode = 200;        
    return
}

sendOrdersCron()
// only for test
// sendOrdersForShops()

app.prepare().then(async () => {
    
    const server = new Koa();        
    const router = new Router();            
    server.keys = [SHOPIFY_API_SECRET_KEY];    
    server.use(koaConnect(compression()))
    server.use(bodyParser());
    const routerUnauthorized = new Router();
    
    server.use(routerUnauthorized.routes());
    routerUnauthorized.get('/', switchSession)
    routerUnauthorized.get('/product-url', getProductUrl)
    routerUnauthorized.get('/product-image-url', getProductImageUrl)
    //Allows routes that do not require authentication to be handled    
    server.use(async (ctx, next) => {
        let noAuth = false
        for (let i in whitelist) {
            if (ctx.request.url.startsWith(whitelist[i])) noAuth = true
        }
        
         //for shopify, if auth shop is undefined. fallbackRoute below somehow does not work
        if (ctx.request.url.startsWith('/auth') && ctx.query.shop == 'undefined') {
            return ctx.redirect('/home')
        }
        
        if (noAuth) {               
            return handleRender(ctx)
        } else {
            await next()
        }
    });    

    server.use(session({
        //30 days in miliseconds
        maxAge: 2419200000,        
        renew: true,        
    }, server));
    server.use(router.routes());
    server.use(shopifyAuth());
    //Everything after this point will require shopify authentication
    server.use(verifyRequest({
        // path to redirect to if verification fails
        // defaults to '/auth'
        authRoute: '/auth',
        // path to redirect to if verification fails and there is no shop on the query
        // defaults to '/auth'
        fallbackRoute: '/home',
    }));
    
    router.get('/', processPayment);        
    router.get('/get-user', getUser);        
    router.get('/get-products', getProducts);
    router.get('/get-rules', getRules);    
    router.get('/get-orders', getOrders);
    router.get('/get-settings', getSettings);
    router.get('/get-day-orders', getAllOrdersForDay);
    router.get('/gmail-auth', getTokens);
    router.get('/get-order-pdf', getOrderPDFPreview);
    router.get('/get-pdf-preview', getPDFPreview);
    router.get('/change-subscription', changeSubscription)

    router.post('/add-rule', addRule);
    router.post('/edit-rule', editRule);
    router.post('/remove-rule', removeRule);
    router.post('/contact-us', contactUs);
    router.post('/email-template', setTemplateText);
    router.post('/send-method', setSendMethod);
    router.post('/set-pdf-order-limit', setPDFOrderLimit);
    router.post('/send-orders', sendOrders);    
    router.post('/gmail-logout', gmailLogout);
    router.post('/set-email', setEmail);
    router.post('/self-email-copy', setSelfEmailCopy);
    
    //validates webhook and listens for events in the store
    router.post('/webhooks/app/uninstalled', appUninstalled) 
    //gdpr requirements
    
    router.post('/webhooks/customers/data_request', dataRequest)    
    router.post('/webhooks/customers/redact', customerRedact)    
    router.post('/webhooks/shop/redact', shopRedact)    

    //Lets next.js prepare all the requests on the React side
    server.use(handleRender);   

    server.listen(port, () => {
        console.log(`Running on port: ${port}`);
    });
});