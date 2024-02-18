import { abbadabbabotSay, sendMessageToChannel } from "./openAI.js";
import { settings_db, sched_db } from "./database.js";
import Discord from "discord.js";
import { formatTime } from "./utilities.js";
import cron from 'node-cron';

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
  if (msg.author.username !== "Abbadabbabot v3.2-b") {
    const dn_regex = /dee(?:z|s)?(?:e| )? ?nut(?:s|z)?/i;

    if (dn_regex.test(msg.content)) {
      await settings_db.math("deeze_nutz", "add", 1);
      console.log("deeze nutz added");
      msg.react("👀");
    }

    console.log(`${msg.author.username}: `, msg.content.toLowerCase());

    switch (true) {
      case /^abbadabbabot.*/i.test(msg.content.toLowerCase()):
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
    }
  }
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
  // Define an array of user IDs to ignore
  var users_to_ignore = process.env.USERS_TO_IGNORE
    ? process.env.USERS_TO_IGNORE.split(",")
    : [];
  var channel_to_ignore = [process.env.CHANNEL_TO_IGNORE];
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

// Schedule a task to run every day at 9 AM
cron.schedule('*/5 * * * *', () => {
  const channel = client.channels.cache.get('709474400747126816');
  if(channel) {
    channel.send('Check-in message: How is everyone today? React to this message!').then(sentMessage => {
      // Store the message ID if you need to reference it later
      console.log(`Check-in message sent with ID: ${sentMessage.id}`);
    }).catch(console.error);
  }
}, {
  scheduled: true,
  timezone: "America/Chicago"
});

export { client };
