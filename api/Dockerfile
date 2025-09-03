FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies first
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy source
COPY . .

# Ensure logs directory exists for winston file transport
RUN mkdir -p logs

EXPOSE 3001

CMD ["node", "index.js"]

