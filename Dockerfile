FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the React frontend
RUN npm run build

# Expose the designated port
ENV PORT=8080
EXPOSE 8080

# Start both Express and the data streamer using concurrently
CMD ["npm", "run", "serve-all"]
