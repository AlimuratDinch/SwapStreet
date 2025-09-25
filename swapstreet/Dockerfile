FROM node:18

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npx", "next", "telemetry", "disable"]
CMD ["npm", "run", "dev"]
