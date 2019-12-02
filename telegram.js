const Telegraf = require("telegraf");
const TelegrafInlineMenu = require("telegraf-inline-menu");
const { STATUS_PAGE, TELEGRAM_TOKEN, IPS } = process.env;
const ips = JSON.parse(IPS || `{"nodes":[]}`).nodes;
const { map, partial, isEmpty } = require("lodash");
const db = require("./db");

if (isEmpty(TELEGRAM_TOKEN)) {
    console.log("No telegram token found!")
    return;
}

const bot = new Telegraf(TELEGRAM_TOKEN);

function buildMenu() {
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

    return menu;
}

async function notifyAboutChanges(state, { validator, vchains }) {
    const subscribers = await db.getSubscribers({ validator });
    map(subscribers, (subscriber) => {
        const multipleChains = vchains.length > 1;
        const message = `${multipleChains ? 'vchains' : 'vchain'} ${vchains.join(", ")} ${multipleChains ? 'are' : 'is'} ${state} for ${validator}!`;
        bot.telegram.sendMessage(subscriber, message)
    });
}

async function pollForNotifications() {
    const goingDown = await db.detectGoingDown();
    map(goingDown, partial(notifyAboutChanges, "down"));

    console.log("down", goingDown);

    const goingUp = await db.detectGoingUp();

    console.log("up", goingUp)
    map(goingUp, partial(notifyAboutChanges, "up"));
}

bot.use(buildMenu().init());

bot.launch();

pollForNotifications();
setInterval(pollForNotifications, 60000);
