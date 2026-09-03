FROM node:20-alpine

# Native deps some npm packages (e.g. leaflet/sharp-adjacent) need to build
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
