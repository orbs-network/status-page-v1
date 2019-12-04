const Telegraf = require("telegraf");
const TelegrafInlineMenu = require("telegraf-inline-menu");
const { STATUS_PAGE, TELEGRAM_TOKEN, IPS } = process.env;
const ips = JSON.parse(IPS || `{"nodes":[]}`).nodes;
const { map, partial, isEmpty, includes, reduce, find } = require("lodash");
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

async function notifyAboutChanges(lastBatch, state, validators, subscriber) {
    const lines = map(validators, ({ validator, vchains }) => {
        const multipleChains = vchains.length > 1;
        return `${multipleChains ? 'vchains' : 'vchain'} ${vchains.join(", ")} ${multipleChains ? 'are' : 'is'} ${state} for ${validator}`;
    });

    if (!isEmpty(lines)) {
        lines.push(`\n${STATUS_PAGE}/status/${lastBatch}`);
        bot.telegram.sendMessage(subscriber, lines.join("\n"))
    }
}

function getValidatorsPerSubscriber(subscriptions, validators) {
    return reduce(subscriptions, (data, subscription) => {
        if (isEmpty(data[subscription.telegramId])) {
            data[subscription.telegramId] = [];
        }

        const affectedValidators = find(validators, { validator: subscription.validator});
        if (!isEmpty(affectedValidators)) {
            data[subscription.telegramId].push(affectedValidators);
        }

        return data;
    }, {})
}

async function pollForNotifications() {
    const lastBatch = await db.getLastBatch();
    const goingDown = await db.detectGoingDown(lastBatch);
    const goingUp = await db.detectGoingUp(lastBatch);

    const subscriptions = await db.getSubscribers(map(goingDown, "validator"));

    map(getValidatorsPerSubscriber(subscriptions, goingDown), partial(notifyAboutChanges, lastBatch, "down"));    
    map(getValidatorsPerSubscriber(subscriptions, goingUp), partial(notifyAboutChanges, lastBatch, "up"));
}

bot.use(buildMenu().init());

bot.launch();

pollForNotifications();
setInterval(pollForNotifications, 60000);
