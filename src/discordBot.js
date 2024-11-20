import { abbadabbabotSay, sendMessageToChannel } from "./openAI.js";
import { settings_db, sched_db, checkin_db } from "./database.js";
import Discord from "discord.js";
import { formatTime } from "./utilities.js";
import cron from 'node-cron';

let lastCheckinMessageId = "1208710768623886416";
const client = new Discord.Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "GUILD_VOICE_STATES",
    "GUILD_MESSAGE_REACTIONS",
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("Abba and Friends", { type: "WATCHING" });
});

client.on("messageCreate", async (msg) => {
  //ignore self messages
  if (msg.author.username !== process.env.BOT_NAME) {
    const dn_regex = /dee(?:z|s)?(?:e| )? ?nut(?:s|z)?/i;

    if (dn_regex.test(msg.content)) {
      await settings_db.math("deeze_nutz", "add", 1);
      console.log("deeze nutz added");
      msg.react("👀");
    }

    console.log(`${msg.author.username}: `, msg.content.toLowerCase());

    switch (true) {
      case new RegExp(`^\\b${process.env.BOT_TRIGGER}.*`, 'i').test(msg.content.toLowerCase()):
        abbadabbabotSay(msg);
        break;
      case /^!engage_chat.*/i.test(msg.content.toLowerCase()):
        const channels = msg.guild.channels.cache.filter(
          (channel) => channel.type === "GUILD_TEXT"
        );

        if (channels.size === 0) {
          msg.reply("No text channels found in this guild.");
          break;
        } else {
          const randomChannel = channels.random();
          const channel_title = randomChannel.name;
          console.log("random message to ", channel_title);
          msg.reply(`Attempting to engage chat in ${channel_title}`);
          sendMessageToChannel(
            `Write a random question to try and engage conversation in this discord channel. The channel title is: ${channel_title}, assume a random topic based off the channel.`,
            randomChannel.id,
            "",
            ""
          );
        }
        break;
      case /^!sched.*/i.test(msg.content.toLowerCase()):
        // Fetch schedules directly if the method is synchronous
        const schedulesObject = sched_db.all();
        let upcomingSchedules = [];
        const now = new Date().getTime();

        // Loop through the object keys (timestamps)
        for (const timestamp in schedulesObject) {
          // Filter out schedules with timestamps that are in the future
          if (Number(timestamp) > now) {
            // Add each schedule in the array to the upcomingSchedules array
            upcomingSchedules = upcomingSchedules.concat(
              schedulesObject[timestamp]
            );
          }
        }

        // Sort the upcomingSchedules array by timestamp
        upcomingSchedules.sort((a, b) => a.timestamp - b.timestamp);

        // Find the next upcoming schedule
        const nextSchedule = upcomingSchedules.find(
          (schedule) => schedule.timestamp > now
        );

        if (nextSchedule) {
          console.log("got schedule");
          // Calculate time remaining
          const timeRemaining = nextSchedule.timestamp - now;
          const timeString = formatTime(timeRemaining); // Assuming formatTime is a function you have

          // Respond with the next schedule
          msg.content = nextSchedule.prompt;
          try {
            await abbadabbabotSay(
              msg,
              "",
              `\nNext Stream could possibly happen in ${timeString}-ish`
            );
          } catch (error) {
            console.error("Error in abbadabbabotSay:", error);
          }
        } else {
          console.log("no schedule");
          // No upcoming schedule
          const prompt = `Make up a bizarre reason why abbabox hasn't done the schedule yet. Make sure to remind chat to go easy on abba for not getting the schedule done yet.`;
          //const prompt = `Give @${msg.author.username} a verbal spanking for requesting the schedule during NO SCHED DECEMBER!`;

          msg.content = prompt;
          await abbadabbabotSay(msg, "", `- NO SCHED YET.`);
        }
        break;

      case /^!dn_count.*/i.test(msg.content.toLowerCase()):
        var dn_count = settings_db.get("deeze_nutz");
        msg.content = `There has been ${dn_count} deeze nutz jokes recorded in this discord.`;
        abbadabbabotSay(msg, "", `- ${dn_count} deeze nutz since 8/14/22`);
        break;
        case /^!checkins.*/i.test(msg.content.toLowerCase()):
          const checkins = checkin_db.all();
          // See if msg.author.username is in the checkins object
          if(checkins) {
            // Loop over see if the user is in every one message
            var in_all_checkins = true;
            for (const checkinId in checkins) {
              const checkin = checkins[checkinId];
              if (!checkin.includes(msg.author.username)) {
                in_all_checkins = false;
                break; // If user is not found in a checkin, no need to continue the loop
              }
            }
            if (in_all_checkins) {
              msg.content = `please help me craft a discord message for ${msg.author.username} letting them know they've checked in every time. In just a sentence or less.`;
              abbadabbabotSay(msg, "", `- All Checkins`);
            } else {
              msg.content = `please help me craft a discord message for ${msg.author.username} letting them know they've missed a checkin and have lost the game. In just a sentence or less.`
              abbadabbabotSay(msg, "", `- Missed Checkins 😭`);
            }
          }
          break;
          case /^!survivors.*/i.test(msg.content.toLowerCase()):
        const allCheckins = checkin_db.all();
        const usersInAllCheckins = {};

        // Initialize usersInAllCheckins with the users in the first checkin
        for (const user of allCheckins[Object.keys(allCheckins)[0]]) {
          usersInAllCheckins[user] = true;
        }

        // Loop over the rest of the checkins
        for (const messageId in allCheckins) {
          const checkin = allCheckins[messageId];

          // Loop over the users in usersInAllCheckins
          for (const user in usersInAllCheckins) {
            // If the user is not in the current checkin, remove them from usersInAllCheckins
            if (!checkin.includes(user)) {
              delete usersInAllCheckins[user];
            }
          }
        }

        // Convert the usersInAllCheckins object to an array
        const usersArray = Object.keys(usersInAllCheckins);

        // Send a message with the list of users
        msg.content = `The following users have a checkin for every messageId: ${usersArray.join(', ')}`;
        abbadabbabotSay(msg, "", `- Survivors are: ${usersArray.join(', ')}`);
        break;
    }
  }
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
  // Define an array of user IDs to ignore
  var users_to_ignore = process.env.USERS_TO_IGNORE
    ? process.env.USERS_TO_IGNORE.split(",")
    : [];
  var channel_to_ignore = process.env.CHANNEL_TO_IGNORE
    ? process.env.CHANNEL_TO_IGNORE.split(",")
    : [];
  var secondary_notification_only = [process.env.SECONDARY_NOTIFICATION_ONLY];
  var notification_channel = client.channels.cache.get(
    process.env.NOTIFICATION_CHANNEL
  );
  var secondary_notification_channel = client.channels.cache.get(
    process.env.SECONDARY_NOTIFICATION_CHANNEL
  );
  let newUserChannel = newMember.channelId;
  let oldUserChannel = oldMember.channelId;
  let memberName = newMember.member.id;
  let displayName = newMember.member.user.username;

  // Check if the user is in the ignore list
  if (users_to_ignore.includes(memberName)) {
    return; // Exit the function if the user is to be ignored
  }

  if (
    (oldUserChannel === null ||
      oldUserChannel === undefined ||
      oldUserChannel !== newUserChannel) &&
    newUserChannel !== null
  ) {
    if (
      oldUserChannel !== newUserChannel &&
      oldUserChannel !== undefined &&
      oldUserChannel !== null
    ) {
      if (
        !channel_to_ignore.includes(newUserChannel) &&
        !channel_to_ignore.includes(oldUserChannel)
      ) {
        if (!secondary_notification_only.includes(oldUserChannel)) {
          //notification_channel.send( `*sigh* just to let you know, <@${memberName}> has left <#${oldUserChannel}>`);
          sendMessageToChannel(
            `announce that, <@${memberName}> has left <#${oldUserChannel}> in the VC, in a sentence or less`,
            process.env.NOTIFICATION_CHANNEL,
            "",
            "",
            client
          );
        }
        if (secondary_notification_only.includes(oldUserChannel)) {
          //secondary_notification_channel.send( `*sigh* just to let you know, <@${memberName}> has left <#${oldUserChannel}>`);
          sendMessageToChannel(
            `announce that, <@${displayName}> has left <#${oldUserChannel}> in the VC, in a sentence or less`,
            process.env.SECONDARY_NOTIFICATION_CHANNEL,
            "",
            "",
            client
          );
        }
      }
    }
    if (!channel_to_ignore.includes(newUserChannel)) {
      if (!secondary_notification_only.includes(newUserChannel)) {
        //notification_channel.send( `Hey human scum, <@${memberName}> has joined <#${newUserChannel}>`);
        sendMessageToChannel(
          `announce that, <@${displayName}> has joined <#${newUserChannel}> in the VC, in a sentence or less`,
          process.env.NOTIFICATION_CHANNEL,
          "",
          "",
          client
        );
      }
      if (secondary_notification_only.includes(newUserChannel)) {
        //secondary_notification_channel.send( `Hey Human scum, <@${memberName}> has joined <#${newUserChannel}>`);
        sendMessageToChannel(
          `announce that, <@${displayName}> has joined <#${newUserChannel}> in the VC, in a sentence or less`,
          process.env.SECONDARY_NOTIFICATION_CHANNEL,
          "",
          "",
          client
        );
      }
    }
  } else if (newUserChannel === null) {
    if (!channel_to_ignore.includes(oldUserChannel)) {
      if (!secondary_notification_only.includes(oldUserChannel)) {
        //notification_channel.send( `Thank goodness, <@${memberName}> has left <#${oldUserChannel}>`);
        sendMessageToChannel(
          `announce that, <@${displayName}> has left <#${oldUserChannel}> in the VC, in a sentence or less`,
          process.env.NOTIFICATION_CHANNEL,
          "",
          "",
          client
        );
      }
      if (secondary_notification_only.includes(oldUserChannel)) {
        //secondary_notification_channel.send( `Thank goodness, <@${memberName}> has left <#${oldUserChannel}>`);
        sendMessageToChannel(
          `announce that, <@${displayName}> has left <#${oldUserChannel}> in the VC, in a sentence or less`,
          process.env.SECONDARY_NOTIFICATION_CHANNEL,
          "",
          "",
          client
        );
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

/*
cron.schedule('45 * * * *', async () => {
  const channel = client.channels.cache.get('1208646869698347119');
  if(channel) {
    let checkinPrompt = await abbadabbabotSay("Help me generate a discord message that I'll be sending in a 24 hour checkin channel: Make me a short announcement for users that it's time to check in for the 24 hour check-in.",'',' - React before next message to checkin.');
    channel.send(checkinPrompt).then(sentMessage => {
      lastCheckinMessageId = sentMessage.id;
      // Store the message ID if you need to reference it later
      console.log(`Check-in message sent with ID: ${sentMessage.id}`);
    }).catch(console.error);
  }
}, {
  scheduled: true,
  timezone: "America/Chicago"
});

client.on('messageReactionAdd', async (reaction, user) => {
  // Check if the reaction is on the check-in message
  if (reaction.message.id !== lastCheckinMessageId) return;

  console.log(`${user.tag} reacted with ${reaction.emoji.name} to message ${reaction.message.id}`);
  // Get the checkins
  let last_checkins = checkin_db.get(lastCheckinMessageId);
  console.log('last_checkins', last_checkins)
  // See if this user is in the last checkins array
  if (last_checkins && last_checkins.length > 0) {

    let in_checkin = last_checkins.findIndex(function (last_checkin, index) {   
      if (last_checkin == user.tag) return true;
    });

    if (in_checkin !== -1) {
      console.log(`${user.tag} has already checked in`);
      return;
    }
  }
  checkin_db.push(lastCheckinMessageId, user.tag);
});*/

export { client };
