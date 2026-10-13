// The channel link never reaches the page: the student is sent there by a server redirect.
// With TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_ID every student gets a personal single-use link
// (the bot must be a channel admin allowed to invite users), so a copied link is useless to anyone else.
// Without them the static TELEGRAM_INVITE_LINK from config.env is used.
const User = require('./../models/userModel');

const LINK_LIFETIME_SECONDS = 60 * 60;

const callBot = async (method, body) => {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHANNEL_ID, ...body })
  });
  const data = await res.json();
  if(!data.ok) throw new Error(`Telegram ${method} failed: ${data.description}`);
  return data.result;
};

const personalLink = async user => {
  const { telegramInviteLink: oldLink } = await User.findById(user._id).select('+telegramInviteLink');
  if(oldLink) await callBot('revokeChatInviteLink', { invite_link: oldLink }).catch(() => {});

  const { invite_link } = await callBot('createChatInviteLink', {
    name: String(user.name).slice(0, 32),
    member_limit: 1,
    expire_date: Math.floor(Date.now() / 1000) + LINK_LIFETIME_SECONDS
  });
  await User.updateOne({ _id: user._id }, { telegramInviteLink: invite_link });
  return invite_link;
};

exports.getInviteLink = async user => {
  if(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID) return personalLink(user);
  return process.env.TELEGRAM_INVITE_LINK;
};
