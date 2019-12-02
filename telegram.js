const Telegraf = require("telegraf");
const TelegrafInlineMenu = require("telegraf-inline-menu");
const { STATUS_PAGE, TELEGRAM_TOKEN, IPS } = process.env;
const ips = JSON.parse(IPS || `{"nodes":[]}`).nodes;
const { map, keys } = require("lodash");
const db = require("./db");

const bot = new Telegraf(TELEGRAM_TOKEN);

const menu = new TelegrafInlineMenu(ctx => `This is network status bot for ${STATUS_PAGE}.
`);
menu.setCommand('start');

map(ips, ({ name }) => {
    menu.toggle(`subscribe to ${name}`, `subscribe-${name}`, {
        setFunc: async (ctx, shouldSubscribe) => {
            if (shouldSubscribe) {
                try {
                    await db.subscribe(name, ctx.from.id, ctx.from.username);
                    menu.replyMenuMiddleware();
                } catch (e) {
                    ctx.reply(`could not subscribe to ${name}, please contract the bot administrator`);
                }
            } else {
                try {
                    await db.unsubscribe(name, ctx.from.id);
                    menu.replyMenuMiddleware();
                } catch (e) {
                    ctx.reply(`could not unsubscribe to ${name}, please contract the bot administrator`);
                }
            }
        },
        isSetFunc: async (ctx) => {
            return db.getSubscription({ validator: name, telegramId: ctx.from.id });
        }
    });
}).join("\n");

bot.use(menu.init());

bot.launch();
