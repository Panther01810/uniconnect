FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# Copy frontend
COPY . /app/

EXPOSE 3001

CMD ["npm", "start"]