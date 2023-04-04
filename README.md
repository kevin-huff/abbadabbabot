Abbadabbabot v3.2-b
===================

This is a Discord bot called Abbadabbabot v3.2-b. It uses the OpenAI GPT-4 model to generate responses, while implementing additional functionality such as censoring specific words and handling various Discord events.

Features
--------

-   Uses OpenAI GPT-4 model to generate responses in the context of a foul-mouthed AI character
-   Censors specific words or phrases using the CensorSensor library
-   Keeps track of the number of "deeze nutz" jokes made in the server
-   Manages stream schedules and provides countdowns for upcoming streams
-   Sends notifications when users join or leave voice channels

Installation
------------

1.  Make sure you have Node.js installed on your system.
2.  Clone this repository and navigate to the project folder.
3.  Run `npm install` to install the required dependencies.
4.  Create a `.env` file in the project root and add the following environment variables:

makefileCopy code

`OPENAI_API_KEY=your_openai_api_key
DISCORD_TOKEN=your_discord_bot_token`

1.  Run `node index.js` to start the bot.

Usage
-----

Send messages in your Discord server with specific keywords or commands to interact with Abbadabbabot. The bot will generate responses based on the context and send them as replies.

Here are some example commands:

-   `abbadabbabot`: Get a response from Abbadabbabot in the context of the message.
-   `!sched`: Get the current stream schedule or a generated response if no schedule is set.
-   `!next_stream`: Set the date and time of the next stream and an optional prompt.
-   `!dn_count`: Get the number of "deeze nutz" jokes recorded in the server.
-   `!engage_chat`: Attempts to engage chat in discussion in a random channel based off the channel's name.

The bot also sends notifications when users join or leave voice channels, excluding specific channels as defined in the code.

Customization
-------------

You can customize the behavior of the bot by modifying the code in `index.js`. For example, you can add or remove words to censor, change the Discord events that the bot listens to, or adjust the GPT-4 model parameters.