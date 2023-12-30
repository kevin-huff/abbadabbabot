FROM node:18.3.0-alpine3.14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
VOLUME /usr/scr/app/db
CMD ["npm", "start"]