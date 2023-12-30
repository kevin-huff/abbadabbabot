Abbadabbabot v3.2-b
===================

Abbadabbabot is a Discord bot that leverages the power of OpenAI's GPT-4 model to generate contextually relevant (and fun) responses. It also offers additional features such as word censoring, event handling, and more.

Features
-

- Utilizes the OpenAI GPT-4 model to generate responses, embodying a unique AI character.
- Utilizes Langchain framework for conversationsal LLM & persistent conversation memory
- Employs the CensorSensor library to censor specific words or phrases.
- Tracks the count of "deeze nutz" jokes made within the server.
- Manages stream schedules and provides countdowns for upcoming streams.
- Sends notifications when users join or leave voice channels.

Prerequisites
-
- A discord bot account
- OpenAI API key
- Node.js (or docker)



Installation
-
### Node.js
1.  Make sure you have Node.js installed on your system.
2.  Clone this repository and navigate to the project folder.
3.  Run `npm install` to install the required dependencies.
4. Populate the `.env` file with your environment variables.
5. Add in your environment variables.
6. Run `node index.js` to start the bot.
### Docker
This repository contains a Docker file for Abbadabbabot, to make it easy to host your own. Simply use `docker build -t your-app-name .` and then run the container using the environement variables below.


#### Environment Variables
The Docker image uses the following environment variables:

* `DISCORD_TOKEN`: Your Discord bot token.
* `OPENAI_API_KEY`: Your OpenAI API key.
* `DISCORD_OAUTH`: Discord OAuth token.
* `CHECKIN_CHANNEL`: The ID of the Discord channel for check-ins.
* `CHANNEL_TO_IGNORE`: The ID of the Discord channel to ignore.
* `SECONDARY_NOTIFICATION_ONLY`: Set to true to enable secondary notifications only.
* `NOTIFICATION_CHANNEL`: The ID of the Discord channel for notifications.
* `SECONDARY_NOTIFICATION_CHANNEL`: The ID of the Discord channel for secondary notifications.
* `USERS_TO_IGNORE`: Users to not alert about voice status changes
* `sched_user`: username to user for login of the schedule creator
* `sched_pass`: password for login of the schedule creator

You can set these environment variables when you run the Docker image using the -e option with docker run:

```docker run -e DISCORD_TOKEN=your-token -e OPENAI_API_KEY=your-key ...```

Replace `your-token`, `your-key`, etc. with your actual Discord token, OpenAI API key, etc.

#### Persistent Storage
The Docker image uses a volume for the `/usr/src/app/db` directory to persist the database. You can create this volume when you run the Docker image using the `-v` option with `docker run`:

```docker run -v /path/on/host:/usr/src/app/db ...```

Replace `/path/on/host` with the path to the directory on your host machine that you want to use for the volume. Any data that the Docker container writes to the `/usr/src/app/db` directory will be stored in this directory on the host machine, and will persist even if the Docker container is stopped or deleted.

#### Building and Running the Docker Image
You can build and run the Docker image using Docker. See the Docker documentation for more information on how to use Docker.

Usage
-----

Interact with Abbadabbabot by sending messages with specific keywords or commands in your Discord server. The bot will generate contextually relevant responses and send them as replies.

Here are some example commands:

-   `abbadabbabot`: Get a response from Abbadabbabot in the context of the message.
-   `!sched`: Get the current stream schedule or a generated response if no schedule is set.
-   `!next_stream`: Set the date and time of the next stream and an optional prompt.
-   `!dn_count`: Get the number of "deeze nutz" jokes recorded in the server.
-   `!engage_chat`: Attempts to engage chat in discussion in a random channel based off the channel's name.

The bot also sends notifications when users join or leave voice channels, excluding specific channels as defined in the code.

Customization
-------------

Big things you'd want to update are in the openAI settings in `src/openAI.js` such as the `systemPrompt` or the `memory_limit`